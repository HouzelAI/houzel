import StreamingIndicator from '@/components/streaming-indicator';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import AppLogo from './app-logo';
import Markdown from './ui/markdown';

type Message = {
    id?: number;
    type: 'response' | 'error' | 'prompt';
    content: string;
    saved?: boolean;
};

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

    return (
        <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-4 p-4">
                {messages.map((message, index) => {
                    // Create a unique key that won't conflict between saved and new messages
                    const key = message.id ? `db-${message.id}` : `local-${index}-${message.content.substring(0, 10)}`;

                    return (
                        <div key={key} className={cn('relative', message.type === 'prompt' && 'flex justify-end')}>
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
                                {/* <p className="whitespace-pre-wrap text-sm">{message.content}</p> */}
                                <Markdown>{message.content}</Markdown>
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
                            {/* <p className="whitespace-pre-wrap text-sm">{streamingData}</p> */}
                            <Markdown>{streamingData}</Markdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
