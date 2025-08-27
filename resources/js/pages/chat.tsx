import Conversation from '@/components/conversation';
import TitleGenerator from '@/components/title-generator';
import SidebarTitleUpdater from '@/components/sidebar-title-updater';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useStream } from '@laravel/stream-react';
import { ArrowUp, Info, ImagePlus, X, Paperclip } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { ChatType, Message } from '@/types/chat';

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
        if (chat?.messages) {
            const parsedMessages: Message[] = chat.messages.map(message => ({
                ...message,
                images: message.images 
                    ? Array.isArray(message.images) 
                        ? message.images 
                        : JSON.parse(message.images as string)
                    : undefined
            }));
            setMessages(parsedMessages);
        }
    }, [chat?.messages]);

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
                        <div className="w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] mx-auto px-6 py-4">
                            <h1 className="text-lg font-semibold text-foreground">
                                {currentTitle}
                                {isTitleStreaming && (
                                    <span className="ml-1 animate-pulse">|</span>
                                )}
                            </h1>
                        </div>
                    </div>
                )}

                <Conversation messages={messages} streamingData={data} isStreaming={isStreaming} streamId={id} />

                <div className="w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] mx-auto p-6 max-sm:px-4 animate-home-chat-hidden">
                    <div className="flex flex-col gap-4 rounded-[22px] transition-all relative bg-[var(--fill-input-chat)] p-3 max-h-[300px] shadow-[0px_12px_32px_0px_rgba(0,0,0,0.02)] border border-black/8 dark:border-[#ffffff14]">
                        
                        {/* Image Preview Section */}
                        {selectedImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                                {selectedImages.map((imageUrl, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={imageUrl} 
                                            alt={`Upload ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded-md border"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="w-3 h-3" />
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

                                            <Button 
                                                type="submit" 
                                                id='send-button'
                                                disabled={isStreaming || isFetching || (!inputValue.trim() && selectedImages.length === 0)} 
                                                className='rounded-full w-8 h-8 ms-auto p-0'
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