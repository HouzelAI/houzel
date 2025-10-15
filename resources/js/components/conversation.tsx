import StreamingIndicator from '@/components/streaming-indicator';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import AppLogo from './app-logo';
import Markdown from './ui/markdown';
import type { Message } from '@/types/chat';
import { Variants, Transition } from 'motion/react';
import { 
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose
} from '../components/motion-primitives/dialog';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, PencilLine, ScrollText, X, ArrowUp, Info, ImagePlus, Paperclip, InfoIcon, Star, FileSearch, Forward } from 'lucide-react'; // ensure icons are imported

interface ConversationProps {
    messages: Message[];
    streamingData?: string;
    isStreaming: boolean;
    streamId?: string;
    onQuickPick?: (pick: {
      key: 'redacao' | 'escrita' | 'dica';
      label: string;
      text: string;
      icon: 'scroll' | 'pencil' | 'bulb';
    }) => void;
}

type QuickPick = {
    key: 'redacao' | 'escrita' | 'dica';
    label: string;
    text: string;
    icon: 'scroll' | 'pencil' | 'bulb';
};

export default function Conversation({ 
    messages, 
    streamingData,
    isStreaming, 
    streamId,
    onQuickPick
}: ConversationProps) {
    const { auth } = usePage<SharedData>().props;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or during streaming
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, streamingData]);

    function setInputValue(value: string) {
        const input = document.getElementById('chat-input') as HTMLInputElement | null;
        if (input) {
            input.value = value;
            input.focus();
        }
    }

    const customVariants: Variants = {
        initial: {
            opacity: 0,
            scale: 0.95,
            y: 40,
        },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 40,
        },
    };
    
    const customTransition: Transition = {
        type: 'spring',
        bounce: 0,
        duration: 0.25,
    };

    return (
        <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className={
                messages.length === 0 
                ? cn("mx-auto max-w-3xl space-y-4 py-4 px-6 h-full flex items-center")
                : cn("mx-auto max-w-3xl space-y-4 py-4 px-6 h-full")
            }>
                {messages.map((message, index) => {
                    const key = message.id ? `db-${message.id}` : `local-${index}-${message.content.substring(0, 10)}`;

                    return (
                        <div key={key} className={cn('relative', message.type === 'prompt' && 'flex justify-end')}>
                            <div className={message.type == 'prompt' ? 'flex flex-col items-end' : ''}>
                                <div
                                    className={cn(
                                        'inline-block max-w-[100%] rounded-lg p-3',
                                        message.type === 'prompt' ? 'bg-[#343435] text-[#dadada]' : '',
                                    )}
                                >
                                    {message.type != 'prompt' && (
                                        <div className="mb-4">
                                            <AppLogo />
                                        </div>
                                    )}

                                    {message.type === 'prompt' && (index === messages.length - 1 || index === messages.length - 2) && streamId && (
                                        <StreamingIndicator id={streamId} className="absolute top-8 left-3" />
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
                                                    <Dialog variants={customVariants} transition={customTransition}>
                                                        <DialogTrigger className='bg-zinc-950 px-4 py-2 text-sm text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'>
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Imagem ${imageIndex + 1}`}
                                                                className="cursor-pointer w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </DialogTrigger>
                                                        <DialogContent className='w-full h-fit max-w-md bg-white dark:bg-zinc-900'>
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Imagem ${imageIndex + 1}`}
                                                                className="w-full h-[800px] object-contain"
                                                                loading="lazy"
                                                            />
                                                            <DialogClose className='bg-black h-8 w-8 rounded-4xl flex items-center justify-center cursor-pointer' />
                                                        </DialogContent>
                                                    </Dialog>
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

                {messages.length === 0 && (
                    <div className='w-full h-full flex items-start justify-center flex-col'>
                        <p className="text-foreground text-3xl mt-8 mb-0 libre-baskerville">Olá {auth.user.name}</p>
                        <p className="text-muted-foreground text-3xl libre-baskerville">Como posso te ajudar?</p>
                        <div className="flex items-start gap-2 mt-6 relative">
                            <div
                                className="h-9 px-[14px] py-[7px] rounded-full border border-[var(--border-main)] flex justify-center items-center gap-1.5 clickable hover:bg-[var(--fill-tsp-white-light)] cursor-pointer"
                                onClick={() => {
                                    onQuickPick?.({
                                        key: 'redacao',
                                        label: 'Redação',
                                        text: 'Aqui está a foto da minha redação, corrija e me diga o que posso melhorar nela',
                                        icon: 'scroll',
                                    });
                                }}
                            >
                                <div className="w-4 h-4 relative overflow-hidden">
                                    <ScrollText size={16} stroke="var(--icon-tertiary)" />
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <span className="text-[var(--text-primary)] text-[14px] font-normal">Redação</span>
                                </div>
                            </div>

                            <div
                                className="h-9 px-[14px] py-[7px] rounded-full border border-[var(--border-main)] flex justify-center items-center gap-1.5 clickable hover:bg-[var(--fill-tsp-white-light)] cursor-pointer"
                                onClick={() => {
                                    onQuickPick?.({
                                        key: 'escrita',
                                        label: 'Escrita',
                                        text: 'Me ajude a criar uma redação do tema ',
                                        icon: 'pencil',
                                    });
                                }}
                            >
                                <div className="w-4 h-4 relative overflow-hidden">
                                    <PencilLine size={16} stroke="var(--icon-tertiary)" />
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <span className="text-[var(--text-primary)] text-[14px] font-normal">Escrita</span>
                                </div>
                            </div>

                            <div
                                className="h-9 px-[14px] py-[7px] rounded-full border border-[var(--border-main)] flex justify-center items-center gap-1.5 clickable hover:bg-[var(--fill-tsp-white-light)] cursor-pointer"
                                onClick={() => {
                                    onQuickPick?.({
                                        key: 'dica',
                                        label: 'Dica',
                                        text: 'Me dê uma dica para melhorar minha redação ',
                                        icon: 'bulb',
                                    });
                                }}
                            >
                                <div className="w-4 h-4 relative overflow-hidden">
                                    <Lightbulb size={16} stroke="var(--icon-tertiary)" />
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <span className="text-[var(--text-primary)] text-[14px] font-normal">Dica</span>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}