import StreamingIndicator from '@/components/streaming-indicator';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import AppLogo from './app-logo';
import Markdown from './ui/markdown';
import type { Message } from '@/types/chat';

interface ConversationProps {
    messages: Message[];
    streamingData?: string;
    isStreaming: boolean;
    streamId?: string;
}

export default function Conversation({ messages, streamingData, isStreaming, streamId }: ConversationProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or during streaming
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, streamingData]);

    console.log(messages);

    return (
        <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-4 p-4">
                {messages.map((message, index) => {
                    // Create a unique key that won't conflict between saved and new messages
                    const key = message.id ? `db-${message.id}` : `local-${index}-${message.content.substring(0, 10)}`;

                    return (
                        <div key={key} className={cn('relative', message.type === 'prompt' && 'flex justify-end')}>
                            <div className={message.type == 'prompt' ? 'flex flex-col items-end' : ''}>
                                <div
                                    className={cn(
                                        'inline-block max-w-[80%] rounded-lg p-3',
                                        message.type === 'prompt' ? 'bg-[#343435] text-[#dadada]' : '',
                                    )}
                                >
                                    {message.type != 'prompt' && (
                                        <div className="mb-4">
                                            <AppLogo />
                                        </div>
                                    )}

                                    {message.type === 'prompt' && (index === messages.length - 1 || index === messages.length - 2) && streamId && (
                                        <StreamingIndicator id={streamId} className="absolute top-3 -left-8" />
                                    )}

                                    {/* Display text content */}
                                    {message.content && <Markdown>{message.content}</Markdown>}
                                </div>
                                
                                {/* Display images if present */}
                                {message.images && message.images.length > 0 && (
                                    <div className="mb-3 mt-3">
                                        <div className="flex gap-2 max-w-[326px] flex-wrap justify-end">
                                            {(Array.isArray(message.images) ? message.images : []).map((imageUrl, imageIndex) => (
                                                <div 
                                                    key={imageIndex}
                                                    className="relative rounded-lg overflow-hidden border border-[var(--border-light)] cursor-zoom-in max-w-[280px] max-h-[280px] min-w-[80px] min-h-[80px]"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Imagem ${imageIndex + 1}`}
                                                        className="cursor-pointer w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {streamingData && (
                    <div className="relative">
                        <div className="inline-block max-w-[80%] rounded-lg p-3">
                            <div className="mb-4">
                                <AppLogo />
                            </div>
                            <Markdown>{streamingData}</Markdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}