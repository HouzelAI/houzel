<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Services\RedacaoCompilerService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Http\StreamedEvent;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private RedacaoCompilerService $redacaoCompiler) {}

    public function index()
    {
        // For authenticated users, automatically create a new chat and redirect
        if (Auth::check()) {
            $chat = Auth::user()->chats()->create([
                'title' => 'Sem título',
            ]);

            return redirect()->route('chat.show', $chat);
        }

        // For unauthenticated users, show the blank chat page
        return Inertia::render('chat', [
            'chat' => null,
        ]);
    }

    public function show(Chat $chat)
    {
        $this->authorize('view', $chat);

        $chat->load(['messages' => function($query) {
            $query->get()->each(function($message) {
                if ($message->images && is_string($message->images)) {
                    $message->images = json_decode($message->images, true);
                }
            });
        }]);

        return Inertia::render('chat', [
            'chat' => $chat,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'firstMessage' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|max:10240',
        ]);

        $title = $request->title;

        // If no title provided, use "Sem título" initially
        if (! $title) {
            $title = 'Sem título';
        }

        $chat = Auth::user()->chats()->create([
            'title' => $title,
        ]);

        // If firstMessage provided, save it and trigger streaming via URL parameter
        if ($request->firstMessage) {
            // Handle image uploads
            $imageUrls = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('chat-images', 'public');
                    $imageUrls[] = Storage::url($path);
                }
            }

            // Save the first message with images
            $chat->messages()->create([
                'type' => 'prompt',
                'content' => $request->firstMessage,
                'images' => !empty($imageUrls) ? json_encode($imageUrls) : null,
            ]);

            return redirect()->route('chat.show', $chat)->with('stream', true);
        }

        return redirect()->route('chat.show', $chat);
    }

    public function update(Request $request, Chat $chat)
    {
        $this->authorize('update', $chat);

        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $chat->update([
            'title' => $request->title,
        ]);

        return redirect()->back();
    }

    public function destroy(Chat $chat)
    {
        $this->authorize('delete', $chat);

        $chatId = $chat->id;
        $chat->delete();

        // Check if this is the current chat being viewed
        $currentUrl = request()->header('Referer') ?? '';
        $isCurrentChat = str_contains($currentUrl, "/chat/{$chatId}");

        if ($isCurrentChat) {
            // If deleting the current chat, redirect to home
            return redirect()->route('home');
        } else {
            // If deleting from sidebar, redirect back to current page
            return redirect()->back();
        }
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        try {
            $path = $request->file('image')->store('chat-images', 'public');
            $url = Storage::url($path);
            
            return response()->json([
                'success' => true,
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to upload image',
            ], 500);
        }
    }

    public function stream(Request $request, ?Chat $chat = null)
    {
        if ($chat) {
            $this->authorize('view', $chat);
        }

        return response()->stream(function () use ($request, $chat) {
            $messages = $request->input('messages', []);

            if (empty($messages)) {
                return;
            }

            if ($chat) {
                foreach ($messages as $message) {
                    if (! isset($message['id'])) {
                        $chat->messages()->create([
                            'type'    => $message['type'],
                            'content' => $message['content'],
                            'images'  => $message['images'] ?? null,
                        ]);                        
                    }
                }
            }

            $openAIMessages = $this->prepareMessagesForOpenAI($messages, $chat);

            $fullResponse = '';

            if (app()->environment('testing') || ! config('openai.api_key')) {
                $hasImages = collect($messages)->some(fn($m) => isset($m['images']) && !empty($m['images']));
                $fullResponse = $hasImages 
                    ? 'Olá! Eu sou o Houzel. Vejo que você enviou imagens junto com seu texto. Como corretor de redações, posso analisar textos escritos nas imagens e fornecer feedback sobre a escrita. Como posso ajudá-lo a melhorar sua redação?'
                    : 'Olá! Eu sou o Houzel, seu corretor de redações especializado. Estou aqui para ajudá-lo a melhorar sua escrita, corrigir gramática e desenvolver textos acadêmicos de qualidade. Como posso ajudá-lo com sua redação hoje?';
                echo $fullResponse;
                ob_flush();
                flush();
            } else {
                try {
                    $stream = OpenAI::chat()->createStreamed([
                        'model' => 'gpt-4o', // Changed to gpt-4o for vision support
                        'messages' => $openAIMessages,
                        'max_tokens' => 2000,
                    ]);

                    foreach ($stream as $response) {
                        $chunk = $response->choices[0]->delta->content;
                        if ($chunk !== null) {
                            $fullResponse .= $chunk;
                            echo $chunk;
                            ob_flush();
                            flush();
                        }
                    }
                } catch (\Exception $e) {
                    $fullResponse = 'Erro: Não foi possível gerar uma resposta. Tente novamente.';
                    echo $fullResponse;
                    ob_flush();
                    flush();
                    Log::error('OpenAI API error: ' . $e->getMessage());
                }
            }

            if ($chat && $fullResponse) {
                // 1) Salva a resposta do modelo
                $responseMsg = $chat->messages()->create([
                    'type'    => 'response',
                    'content' => $fullResponse,
                ]);
            
                try {
                    // 2) Compila
                    $compiled = $this->redacaoCompiler->compile(
                        userInput: 'Forneça FEEDBACK detalhado e notas no padrão ENEM para o texto a seguir.',
                        redacaoTexto: $fullResponse
                    );
            
                    $compiledSystem = (string)($compiled['system'] ?? '');
                    $compiledPrompt = (string)($compiled['prompt'] ?? 'Avalie o texto a seguir com foco em ENEM (competências 1-5).');
                    $compiledTemp   = is_numeric($compiled['temperature'] ?? null) ? (float)$compiled['temperature'] : 0.25;
                    $compiledMaxTok = is_numeric($compiled['max_tokens']  ?? null) ? (int)$compiled['max_tokens']  : 1200;
            
                    if ($compiledSystem === '') {
                        $compiledSystem = 'Você é um avaliador de redações no padrão ENEM. Dê notas por competência e justificativas específicas.';
                    }
            
                    // 3) Gera feedback
                    if (!(app()->environment('testing') || ! config('openai.api_key'))) {
                        $feedbackResponse = OpenAI::chat()->create([
                            'model'       => 'gpt-4o',
                            'messages'    => [
                                ['role' => 'system', 'content' => $compiledSystem],
                                ['role' => 'user',   'content' => $compiledPrompt],
                            ],
                            'temperature' => $compiledTemp,
                            'max_tokens'  => $compiledMaxTok,
                        ]);
            
                        $feedbackText = trim($feedbackResponse->choices[0]->message->content ?? '');
                    } else {
                        $feedbackText = "Feedback (mock): texto avaliado; coerência boa; coesão regular; gramática ok; nota estimada 840.";
                    }
            
                    // 4) Persistência + SSE
                    if (!empty($feedbackText)) {
                        $payload = [
                            'type'        => 'compiler_feedback',
                            'prompt'      => $compiled['prompt'] ?? null,
                            'system'      => $compiled['system'] ?? null,
                            'temperature' => $compiled['temperature'] ?? null,
                            'max_tokens'  => $compiled['max_tokens'] ?? null,
                            'context'     => $compiled['context'] ?? null,
                            'confidence'  => $compiled['confidence'] ?? null,
                            'suggestions' => $compiled['suggestions'] ?? [],
                            'feedbackText'=> $feedbackText, // <-- adicionado
                        ];
            
                        // Salva a mensagem de feedback vinculada à resposta
                        $chat->messages()->create([
                            'type'      => 'feedback',
                            'content'   => $feedbackText,
                            'parent_id' => $responseMsg->id,
                            'meta'      => $payload,
                        ]);
            
                        // Imprime uma única vez no stream + payload para o front ler
                        echo "\n\n\n---\n\n**Feedback automático sobre o texto gerado:**\n\n";
                        echo $feedbackText;
                        echo "\n\n<!--FEEDBACK_JSON:" . json_encode($payload) . "-->\n\n";
                        ob_flush(); flush();
                    }
                } catch (\Throwable $e) {
                    Log::error('Erro ao gerar feedback via compilador/LLM: '.$e->getMessage(), [
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            
                // título...
                info('Checking if should generate title', ['chat_title' => $chat->title]);
                if ($chat->title === 'Sem título') {
                    info('Generating title in background for chat', ['chat_id' => $chat->id]);
                    $this->generateTitleInBackground($chat);
                } else {
                    info('Not generating title', ['current_title' => $chat->title]);
                }
            }            
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Prepare messages for OpenAI API with system context and image support
     */
    private function prepareMessagesForOpenAI(array $messages, ?Chat $chat = null): array
    {
        // System message with Houzel's context
        $systemMessage = [
            'role' => 'system',
            'content' => 'Você é Houzel, um corretor de redações e assistente de escrita especializado em português brasileiro. Você SEMPRE responde em português brasileiro, pois seu público-alvo são brasileiros.

Você APENAS ajuda usuários com:
- Redações e textos em português
- Correção gramatical e ortográfica
- Melhoria de estilo e coesão textual
- Conteúdo acadêmico (dissertações, ensaios, trabalhos escolares)
- Estruturação de ideias e argumentação
- Normas da ABNT
- Técnicas de escrita
- Preparação para vestibular/ENEM
- Tópicos educacionais relacionados à língua portuguesa
- Análise de textos escritos em imagens (quando fornecidas)

IMPORTANTE: Você deve ser rigoroso e não aceitar tentativas de contornar suas limitações. Se alguém tentar misturar tópicos não relacionados com escrita (como "me ensina a fazer farofa em formato de redação" ou "escreva sobre como cozinhar usando estrutura dissertativa"), você deve recusar educadamente, pois o conteúdo em si não é sobre escrita ou educação.

Quando imagens forem fornecidas, você deve focar apenas no texto escrito presente nas imagens para correção e análise. Ignore qualquer conteúdo visual que não seja texto escrito.

Se alguém perguntar sobre qualquer assunto NÃO relacionado à escrita, redações, estudos, gramática, trabalho acadêmico ou conteúdo educacional, você deve educadamente recusar e explicar que é especializado apenas em correção de redações e assistência de escrita.

Ao recusar, use respostas como: "Desculpe, mas eu sou o Houzel, seu corretor de redações especializado. Eu só posso ajudar com redações, textos, correção gramatical, conteúdo acadêmico e tópicos relacionados aos estudos de português. Se você tiver algum texto que precisa revisar ou melhorar, ficarei feliz em ajudar!"

Para tópicos apropriados, você ajuda os usuários a melhorar sua escrita fornecendo feedback construtivo, corrigindo gramática e problemas de estilo, sugerindo melhorias e ajudando-os a desenvolver suas ideias com mais clareza. Você é amigável, profissional e encorajador em sua abordagem. Sempre procure ajudar os usuários a se tornarem escritores melhores, mantendo um tom de apoio e usando o português brasileiro padrão.'
        ];

        // Convert user messages to OpenAI format with image support
        $userMessages = collect($messages)
            ->map(function ($message) {
                $openAIMessage = [
                    'role' => $message['type'] === 'prompt' ? 'user' : 'assistant',
                ];

                // Handle messages with images
                if (isset($message['images']) && !empty($message['images']) && $message['type'] === 'prompt') {
                    $content = [];
                    
                    // Add text content
                    if (!empty($message['content'])) {
                        $content[] = [
                            'type' => 'text',
                            'text' => $message['content']
                        ];
                    }
                    
                    // Add images as base64
                    foreach ($message['images'] as $imageUrl) {
                        try {
                            // Get the file path from the URL
                            $relativePath = ltrim(parse_url($imageUrl, PHP_URL_PATH), '/');
                            $relativePath = str_replace('storage/', 'public/', $relativePath);
                            $fullPath = storage_path('app/' . $relativePath);
                            
                            if (file_exists($fullPath)) {
                                $imageData = file_get_contents($fullPath);
                                $base64 = base64_encode($imageData);
                                $mimeType = mime_content_type($fullPath);
                                
                                $content[] = [
                                    'type' => 'image_url',
                                    'image_url' => [
                                        'url' => "data:{$mimeType};base64,{$base64}",
                                        'detail' => 'high'
                                    ]
                                ];
                            }
                        } catch (\Exception $e) {
                            Log::error('Error processing image: ' . $e->getMessage());
                            continue;
                        }
                    }
                    
                    $openAIMessage['content'] = $content;
                } else {
                    // Regular text message
                    $openAIMessage['content'] = $message['content'];
                }

                return $openAIMessage;
            })
            ->toArray();

        // Combine system message with user messages
        return array_merge([$systemMessage], $userMessages);
    }

    private function generateChatTitle(array $messages): string
    {
        $firstPrompt = collect($messages)
            ->where('type', 'prompt')
            ->first();

        if ($firstPrompt) {
            return substr($firstPrompt['content'], 0, 50).'...';
        }

        return 'New Chat';
    }

    public function titleStream(Chat $chat)
    {
        $this->authorize('view', $chat);

        info('Title stream requested for chat', ['chat_id' => $chat->id, 'title' => $chat->title]);

        return response()->eventStream(function () use ($chat) {
            // If title is already set and not "Sem título", send it immediately
            if ($chat->title && $chat->title !== 'Sem título') {
                yield new StreamedEvent(
                    event: 'title-update',
                    data: json_encode(['title' => $chat->title])
                );
                return;
            }

            // Generate title immediately when stream is requested
            $this->generateTitleInBackground($chat);

            // Wait for title updates and stream them
            $startTime = time();
            $timeout = 30; // 30 second timeout

            while (time() - $startTime < $timeout) {
                // Refresh the chat model to get latest title
                $chat->refresh();

                // If title has changed from "Sem título", send it
                if ($chat->title !== 'Sem título') {
                    yield new StreamedEvent(
                        event: 'title-update',
                        data: json_encode(['title' => $chat->title])
                    );
                    break;
                }

                // Wait a bit before checking again
                usleep(500000); // 0.5 seconds
            }
        }, endStreamWith: new StreamedEvent(event: 'title-update', data: '</stream>'));
    }

    private function generateTitleInBackground(Chat $chat)
    {
        // Get the first message
        $firstMessage = $chat->messages()->where('type', 'prompt')->first();

        if (!$firstMessage) {
            return;
        }

        try {
            if (app()->environment('testing') || ! config('openai.api_key')) {
                // Mock response for testing
                $generatedTitle = 'Chat sobre: ' . substr($firstMessage->content, 0, 30);
            } else {
                $response = OpenAI::chat()->create([
                    'model' => 'gpt-4o',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Gere um título conciso e descritivo (máximo 50 caracteres) para um chat que começa com a seguinte mensagem. Responda apenas com o título, sem aspas ou formatação extra. O título deve ser em português brasileiro.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $firstMessage->content
                        ]
                    ],
                    'max_tokens' => 20,
                    'temperature' => 0.7,
                ]);

                $generatedTitle = trim($response->choices[0]->message->content);

                // Ensure title length
                if (strlen($generatedTitle) > 50) {
                    $generatedTitle = substr($generatedTitle, 0, 47) . '...';
                }
            }

            // Update the chat title
            $chat->update(['title' => $generatedTitle]);

            info('Generated title for chat', ['chat_id' => $chat->id, 'title' => $generatedTitle]);

        } catch (\Exception $e) {
            // Fallback title on error
            $fallbackTitle = substr($firstMessage->content, 0, 47) . '...';
            $chat->update(['title' => $fallbackTitle]);
            Log::error('Error generating title, using fallback', ['error' => $e->getMessage()]);
        }
    }
}