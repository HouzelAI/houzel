import Conversation from '@/components/conversation';
import TitleGenerator from '@/components/title-generator';
import SidebarTitleUpdater from '@/components/sidebar-title-updater';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useStream } from '@laravel/stream-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { ChatType, Message } from '@/types/chat';
import AppLogo from '@/components/app-logo';
import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, PencilLine, ScrollText, X, ArrowUp, Info, ImagePlus, Paperclip, InfoIcon, Star, FileSearch, Forward } from 'lucide-react'; // ensure icons are imported
import { TextShimmer } from '../components/motion-primitives/text-shimmer';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

type PageProps = {
    auth: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
    chat?: ChatType;
    flash?: {
        stream?: boolean;
    };
};

type QuickPick = {
    key: 'redacao' | 'escrita' | 'dica';
    label: string;
    text: string;
    icon: 'scroll' | 'pencil' | 'bulb';
};

export type MessageType = 'prompt' | 'response' | 'feedback' | 'error';

export type CompilerInfo = {
  type: 'compiler_feedback';
  prompt?: string | null;
  system?: string | null;
  temperature?: number | null;
  max_tokens?: number | null;
  context?: any;
  confidence?: number | null;
  suggestions?: string[];
  feedbackText?: string | null;
};

function ChatWithStream({ chat, auth, flash }: { chat: ChatType | undefined; auth: PageProps['auth']; flash: PageProps['flash'] }) {
    const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
    const [currentTitle, setCurrentTitle] = useState<string>(chat?.title || 'Sem título');
    const [shouldGenerateTitle, setShouldGenerateTitle] = useState<boolean>(false);
    const [isTitleStreaming, setIsTitleStreaming] = useState<boolean>(false);
    const [shouldUpdateSidebar, setShouldUpdateSidebar] = useState<boolean>(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [quickPick, setQuickPick] = useState<QuickPick | null>(null);
    const [compilerInfo, setCompilerInfo] = useState<CompilerInfo | null>(null);
    const [streamBuffer, setStreamBuffer] = useState<string>('');

    const handleQuickPick = (pick: QuickPick) => {
        setQuickPick(pick);
        setInputValue(pick.text);
      
        if (pick.key === 'redacao') {
          document.getElementById('attach-button')?.click();
        }
      
        inputRef.current?.focus();
    };

    const currentChatId = chat?.id || null;
    const streamUrl = currentChatId ? `/chat/${currentChatId}/stream` : '/chat/stream';

    const { data, send, isStreaming, isFetching, cancel, id } = useStream(streamUrl);

    // Auto-focus input and handle auto-streaming on mount
    useEffect(() => {
        inputRef.current?.focus();

        // Auto-stream if we have a chat with exactly 1 message (newly created chat)
        // OR if flash.stream is true (fallback)
        const shouldAutoStream = chat?.messages?.length === 1 || (flash?.stream && chat?.messages && chat.messages.length > 0);

        if (shouldAutoStream) {
            setTimeout(() => {
                send({ messages: chat.messages });
            }, 100);
        }
    }, [chat?.messages, flash?.stream, send]); // Only run on mount

    // Scroll to bottom when streaming
    useEffect(() => {
        if (isStreaming) {
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, [isStreaming, data]);

    // Focus input when streaming completes and trigger title generation
    useEffect(() => {
        if (!isStreaming && inputRef.current) {
            inputRef.current.focus();
            
            // Trigger title generation if this is an authenticated user with "Sem título" chat and we have a response
            if (auth.user && chat && currentTitle === 'Sem título' && data && data.trim()) {
                setShouldGenerateTitle(true);
                setShouldUpdateSidebar(true);
            }
        }
    }, [isStreaming, auth.user, chat, currentTitle, data]);

    // Update current title when chat changes
    useEffect(() => {
        if (chat?.title) {
            setCurrentTitle(chat.title);
        }
    }, [chat?.title]);

    // Parse images from messages if they come from database
    useEffect(() => {
        if (!chat?.messages) return;
      
        const parsedMessages: Message[] = chat.messages.map(message => ({
          ...message,
          images: message.images 
            ? Array.isArray(message.images) 
              ? message.images 
              : JSON.parse(message.images as string)
            : undefined
        }));
        setMessages(parsedMessages);
      
        const lastFeedback = [...parsedMessages]
            .reverse()
            .find((m): m is Message & { type: 'feedback'; meta: CompilerInfo } =>
                m.type === 'feedback' && !!m.meta
            );

        if (lastFeedback) {
            setCompilerInfo(lastFeedback.meta!);
        }

      }, [chat?.messages]);
      

    useEffect(() => {
        if (typeof data !== 'string') return;
        if (data.length === 0) return;
    
        setStreamBuffer(prev => {
        if (data.includes(prev)) return data;
        return prev + data;
        });
    }, [data]);
    
    useEffect(() => {
        if (!streamBuffer) return;
    
        const regex = /<!--FEEDBACK_JSON:(.*?)-->/gs;
        let match: RegExpExecArray | null;
        let lastInfo: CompilerInfo | null = null;
    
        while ((match = regex.exec(streamBuffer)) !== null) {
            try {
                const json = JSON.parse(match[1]);
                if (json && json.type === 'compiler_feedback') {
                lastInfo = json as CompilerInfo;
                }
            } catch {
            }
        }
    
        if (lastInfo) setCompilerInfo(lastInfo);
    }, [streamBuffer]);     

    const handleImageUpload = async (files: FileList) => {
        if (!files.length) return;

        setIsUploadingImage(true);
        
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/chat/upload-image', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Upload failed');
                }

                return result.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setSelectedImages(prev => [...prev, ...uploadedUrls]);
        } catch (error) {
            console.error('Error uploading images:', error);
            // You might want to show a toast notification here
        } finally {
            setIsUploadingImage(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('input[type="text"]') as HTMLInputElement;
        const query = input?.value.trim();

        if (!query && selectedImages.length === 0) return;

        const toAdd: Message[] = [];

        // If there's a completed response from previous streaming, add it first
        if (data && data.trim()) {
            toAdd.push({
                type: 'response',
                content: data,
            });
        }

        // Add the new prompt with images
        toAdd.push({
            type: 'prompt',
            content: query || '',
            images: selectedImages.length > 0 ? [...selectedImages] : undefined,
        });

        // Update local state
        setMessages((prev) => [...prev, ...toAdd]);

        // Send all messages including the new ones
        send({ messages: [...messages, ...toAdd] });

        input.value = '';
        setInputValue('');
        setSelectedImages([]);
        setCompilerInfo(null);
        setStreamBuffer('');
        inputRef.current?.focus();
    }, [send, data, messages, selectedImages]);

    return (
        <>
            <Head title={currentTitle} />
            {/* Title generator with working EventStream */}
            {shouldGenerateTitle && auth.user && chat && (
                <TitleGenerator
                    chatId={chat.id}
                    onTitleUpdate={(newTitle, isStreaming = false) => {
                        setCurrentTitle(newTitle);
                        setIsTitleStreaming(isStreaming);
                        document.title = `${newTitle} - LaraChat`;
                    }}
                    onComplete={() => {
                        setIsTitleStreaming(false);
                        setShouldGenerateTitle(false);
                    }}
                />
            )}
            
            {/* Sidebar title updater - separate EventStream for sidebar */}
            {shouldUpdateSidebar && auth.user && chat && (
                <SidebarTitleUpdater
                    chatId={chat.id}
                    onComplete={() => {
                        setShouldUpdateSidebar(false);
                    }}
                />
            )}
            
            <AppLayout
                currentChatId={chat?.id}
                className="flex h-[calc(100vh-theme(spacing.4))] flex-col overflow-hidden md:h-[calc(100vh-theme(spacing.8))]"
            >
                {!auth.user && (
                    <div className="bg-background flex-shrink-0 p-4">
                        <Alert className="mx-auto max-w-3xl">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Você está conversando anonimamente. Sua conversa não será salva.
                                <Button variant="link" className="h-auto p-0 text-sm" onClick={() => router.visit('/login')}>
                                    Faça login para salvar suas conversas
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Chat Title Display */}
                {auth.user && chat && (
                    <div className="bg-background flex-shrink-0 px-4">
                        <div className="w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] mx-auto px-6 py-4 flex items-center justify-between">
                            { !isTitleStreaming && currentTitle == 'Sem título' ? (
                                <AppLogo />
                            ) : (
                                <h1 className="text-lg font-semibold text-foreground">
                                    {currentTitle}
                                </h1>
                            )}
                            {isTitleStreaming && (
                                <TextShimmer className='text-sm' duration={1}>Pensando...</TextShimmer>
                            )}
                            { currentTitle != 'Sem título' && (
                                <div className="flex items-center gap-2">
                                    <button  className='h-8 px-3 rounded-[100px] inline-flex items-center gap-1 clickable outline-1 outline-offset-[-1px] outline-[var(--border-btn-main)] hover:bg-[var(--fill-tsp-white-light)] me-1.5 hover:cursor-pointer'>
                                        <Forward width={18} className='text-muted-foreground' />
                                        <span className='text-[var(--text-secondary)] text-sm font-medium'>Compartilhar</span>
                                    </button>
                                    <div className="size-[28px] clickable hover:bg-[var(--fill-tsp-white-dark)] rounded-lg flex items-center justify-center hover:cursor-pointer">
                                        <FileSearch width={18} className='text-muted-foreground' />
                                    </div>
                                    <div className="size-[28px] clickable hover:bg-[var(--fill-tsp-white-dark)] rounded-lg flex items-center justify-center hover:cursor-pointer">
                                        <Star width={18} className='text-muted-foreground' />
                                    </div>
                                    <HoverCard openDelay={0}>
                                        <HoverCardTrigger>
                                            <div className="size-[28px] clickable hover:bg-[var(--fill-tsp-white-dark)] rounded-lg flex items-center justify-center hover:cursor-pointer">
                                                <InfoIcon width={18} className='text-muted-foreground' />
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className='bg-[#212122] w-[400px] mt-3' align='end'>
                                            {compilerInfo ? (
                                                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                                                    <div className="text-[var(--text-primary)] font-medium">Feedback do compilador</div>

                                                    <div className="flex justify-between gap-4 text-xs opacity-80 mt-3 font-mono">
                                                        {typeof compilerInfo.confidence === 'number' && (
                                                            <span>confiança: {(compilerInfo.confidence * 100).toFixed(0)}%</span>
                                                        )}
                                                        {typeof compilerInfo.temperature === 'number' && (
                                                            <span>temp: {compilerInfo.temperature}</span>
                                                        )}
                                                        {typeof compilerInfo.max_tokens === 'number' && (
                                                            <span>max_tokens: {compilerInfo.max_tokens}</span>
                                                        )}
                                                    </div>

                                                {compilerInfo.suggestions && compilerInfo.suggestions.length > 0 && (
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wide opacity-70 mb-1 mt-4">sugestões</div>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {compilerInfo.suggestions.slice(0, 5).map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {compilerInfo.prompt && (
                                                    <details>
                                                        <summary className="cursor-pointer text-xs opacity-80">ver prompt</summary>
                                                        <pre className="whitespace-pre-wrap text-xs bg-black/30 p-2 rounded mt-1 overflow-y-scroll h-36">{compilerInfo.prompt}</pre>
                                                    </details>
                                                )}
                                                {compilerInfo.system && (
                                                    <details>
                                                        <summary className="cursor-pointer text-xs opacity-80">ver system</summary>
                                                        <pre className="whitespace-pre-wrap text-xs bg-black/30 p-2 rounded mt-1 overflow-y-scroll h-36">{compilerInfo.system}</pre>
                                                    </details>
                                                )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-[var(--text-secondary)]">
                                                    O feedback do compilador aparecerá aqui após a primeira resposta.
                                                </div>
                                            )}
                                        </HoverCardContent>
                                    </HoverCard>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Conversation 
                    messages={messages}
                    streamingData={data}
                    isStreaming={isStreaming}
                    streamId={id}
                    onQuickPick={handleQuickPick}
                />

                <div className="w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] mx-auto p-6 max-sm:px-4 animate-home-chat-hidden">
                    <div className="flex flex-col gap-4 rounded-[22px] transition-all relative bg-[var(--fill-input-chat)] p-3 max-h-[300px] shadow-[0px_12px_32px_0px_rgba(0,0,0,0.02)] border border-black/8 dark:border-[#ffffff14]">
                        
                        {/* Image Preview Section */}
                        {selectedImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 rounded-lg">
                                {selectedImages.map((imageUrl, index) => (
                                    <div key={index} className="relative group rounded-[12px] h-[54px] w-[54px] group/attach flex justify-center items-center flex-shrink-0 border-[1px] border-solid border-[var(--function-error-tsp)] bg-[var(--function-error-tsp)]">
                                        <img 
                                            src={imageUrl} 
                                            alt={`Upload ${index + 1}`}
                                            className="object-cover w-full h-full border border-[var(--border-light)] rounded-[12px]"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full p-0 group-hover:opacity-100 transition-opacity [&_svg]:size-1"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex-shrink-0">
                            <div className="mx-auto max-w-3xl">
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Dê à Houzel uma redação para trabalhar..."
                                            className="flex-1 border-0 shadow-none focus:ring-0 focus-visible:ring-0 focus:border-0 bg-transparent px-1.5"
                                            id='chat-input'
                                            disabled={isStreaming || isFetching}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    document.getElementById('send-button')?.click();
                                                    if (inputRef.current) {
                                                        inputRef.current.blur();
                                                        setInputValue('');
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="flex items-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full border border-[var(--border-main)] inline-flex items-center justify-center gap-1 clickable cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--fill-tsp-gray-main)] w-8 h-8 p-0 data-[popover-trigger]:bg-[var(--fill-tsp-gray-main)] shrink-0"
                                                id='attach-button'
                                                disabled={isUploadingImage || isStreaming || isFetching}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </Button>
                                            
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        handleImageUpload(e.target.files);
                                                    }
                                                }}
                                            />

                                            <div id="selected-option" className="min-h-[32px] flex items-center relative">
                                                <AnimatePresence>
                                                    {quickPick && (
                                                        <motion.button
                                                            key={quickPick.key}
                                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                                            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="py-1.5 px-2.5 pr-1.5 bg-[var(--fill-blue)] rounded-full border border-[var(--border-input-active)] flex items-center gap-1 clickable cursor-pointer hover:bg-[var(--fill-blue)] hover:opacity-90 h-[32px] min-w-[32px] absolute left-0"
                                                            type="button"
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {quickPick.icon === 'scroll' && <ScrollText size={16} stroke="var(--icon-blue)" />}
                                                                {quickPick.icon === 'pencil' && <PencilLine size={16} stroke="var(--icon-blue)" />}
                                                                {quickPick.icon === 'bulb' && <Lightbulb size={16} stroke="var(--icon-blue)" />}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-[13px] font-medium text-[var(--text-blue)]">
                                                                    {quickPick.label}
                                                                </span>

                                                                <motion.span
                                                                    role="button"
                                                                    aria-label="Remover seleção"
                                                                    onClick={() => setQuickPick(null)}
                                                                    className="inline-block px-[5px] pl-[2px] py-[5px] my-[-5px]"
                                                                    whileHover={{ rotate: 90 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <X size={14} stroke="var(--icon-blue)" />
                                                                </motion.span>
                                                            </div>
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <Button 
                                                type="submit" 
                                                id='send-button'
                                                disabled={isStreaming || isFetching || (!inputValue.trim() && selectedImages.length === 0)} 
                                                className='rounded-full w-8 h-8 ms-auto p-0 cursor-pointer'
                                            >
                                                <ArrowUp />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}

export default function Chat() {
    const { auth, chat, flash } = usePage<PageProps>().props;

    // Use the chat ID as a key to force complete re-creation of the ChatWithStream component
    // This ensures useStream is completely reinitialized with the correct URL
    const key = chat?.id ? `chat-${chat.id}` : 'no-chat';

    return <ChatWithStream key={key} chat={chat} auth={auth} flash={flash} />;
}