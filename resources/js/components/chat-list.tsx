import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useSidebar } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { formatDistance } from "date-fns";
import { pt as ptLocale } from 'date-fns/locale';

interface Chat {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
}

interface ChatListProps {
    currentChatId?: number;
    isAuthenticated: boolean;
}

// Simple in-memory cache
let chatCache: Chat[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

export default function ChatList({ currentChatId, isAuthenticated }: ChatListProps) {
    const [chats, setChats] = useState<Chat[]>(chatCache);
    const [loading, setLoading] = useState(false);
    const [editingChatId, setEditingChatId] = useState<number | null>(null);
    const lastCurrentChatId = useRef<number | undefined>(undefined);
    const editInputRef = useRef<HTMLInputElement>(null);
    const { state } = useSidebar();

    const { data, setData, patch, processing } = useForm({
        title: '',
    });
    const { post: createChat, processing: createProcessing } = useForm();

    const fetchChats = useCallback(
        async (force = false) => {
            if (!isAuthenticated) {
                setChats([]);
                chatCache = [];
                return;
            }

            const now = Date.now();
            if (!force && chatCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
                setChats(chatCache);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('/api/chats');
                const data = await response.json();
                chatCache = data;
                lastFetchTime = now;
                setChats(data);
            } catch {
                // Silently handle fetch errors
            } finally {
                setLoading(false);
            }
        },
        [isAuthenticated],
    );

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Listen for title updates from EventStream
    useEffect(() => {
        const handleTitleUpdate = (event: CustomEvent) => {
            const { chatId, newTitle } = event.detail;
            
            // Update local state
            setChats((prevChats) => 
                prevChats.map((chat) => 
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                )
            );
            
            // Update cache
            chatCache = chatCache.map((chat) => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
            );
        };

        window.addEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
        
        return () => {
            window.removeEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
        };
    }, []);

    // Only refresh when currentChatId changes to a new value (new chat created)
    useEffect(() => {
        if (currentChatId && currentChatId !== lastCurrentChatId.current) {
            lastCurrentChatId.current = currentChatId;
            // Check if this chat is already in our list
            if (!chats.some((chat) => chat.id === currentChatId)) {
                fetchChats(true); // Force refresh for new chats
            }
        }
    }, [currentChatId, chats, fetchChats]);

    const handleNewChat = () => {
        if (!isAuthenticated) {
            router.visit('/login');
        } else {
            createChat('/chat', {
                onSuccess: () => {
                    // Chats will refresh when currentChatId changes
                },
            });
        }
    };

    const handleDeleteChat = (chatId: number, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();

        router.delete(`/chat/${chatId}`, {
            onBefore: () => {
                // Optimistically remove from local state
                setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
                // Clear cache to force fresh fetch next time
                chatCache = chatCache.filter((chat) => chat.id !== chatId);
            },
            onError: () => {
                // If error, refresh to get correct state
                fetchChats(true);
            },
            onFinish: () => {
                // Refresh chat list to ensure consistency
                setTimeout(() => {
                    fetchChats(true);
                }, 100);
            },
            preserveScroll: true,
        });
    };

    const handleEditClick = (chatId: number, currentTitle: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Start editing
        setEditingChatId(chatId);
        setData('title', currentTitle || '');
        // Focus the input after it's rendered
        setTimeout(() => {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }, 10);
    };

    const cancelEditing = () => {
        setEditingChatId(null);
        setData('title', '');
    };

    const saveTitle = (chatId: number) => {
        if (!data.title.trim() || processing) return;

        patch(`/chat/${chatId}`, {
            onSuccess: () => {
                // Update local state
                setChats((prevChats) => prevChats.map((chat) => (chat.id === chatId ? { ...chat, title: data.title.trim() } : chat)));
                // Update cache
                chatCache = chatCache.map((chat) => (chat.id === chatId ? { ...chat, title: data.title.trim() } : chat));
                setEditingChatId(null);
                setData('title', '');
            },
            onError: () => {
                // If error, refresh to get correct state
                fetchChats(true);
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="flex h-full flex-col">
                <div className="flex flex-col gap-[12px]">
                    <button className='inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:opacity-80 bg-[var(--Button-primary-white)] text-[var(--text-primary)] shadow-[0px_0.5px_3px_0px_var(--shadow-S)] hover:opacity-70 active:hover-60 h-[36px] px-[12px] rounded-[10px] gap-[6px] text-sm min-w-[36px] w-full cursor-pointer' onClick={handleNewChat} disabled={createProcessing}>
                        <Plus className="h-4 w-4" />
                        <span className='text-sm font-medium text-[var(--text-primary)] whitespace-nowrap truncate'>Nova conversa</span>
                        <div className="flex items-center gap-0.5">
                            <span className="flex text-[var(--text-tertiary)] justify-center items-center min-w-5 h-5 px-1 rounded-[4px] bg-[var(--fill-tsp-white-light)] border border-[var(--border-light)]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-command"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path></svg></span>
                            <span className="flex justify-center items-center w-5 h-5 px-1 rounded-[4px] bg-[var(--fill-tsp-white-light)] border border-[var(--border-light)] text-sm font-normal text-[var(--text-tertiary)] ">K</span>
                        </div>
                    </button>
                    <div className={cn('mb-2 w-fit flex justify-center items-center clickable rounded-[999px] px-[12px] py-[7px] border-none outline-offset-0 outline-[var(--border-dark)] text-[13px] leading-[18px] bg-[var(--tab-active-black)] text-[var(--text-onblack)] outline-none outline-0', state === 'collapsed' ? 'justify-center' : 'justify-between')}>
                        {state === 'expanded' && <h3 className="text-sm font-normal">Todos</h3>}
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className={cn('space-y-1', state === 'collapsed' && 'flex flex-col items-center')}>
                        {loading && chats.length === 0
                            ? state === 'expanded' && <p className="text-muted-foreground py-2 text-sm">Loading...</p>
                            : chats.length === 0
                              ? state === 'expanded' && <p className="text-muted-foreground py-2 text-sm">No chats yet</p>
                              : chats.map((chat) => {
                                    // When collapsed, show only icon
                                    if (state === 'collapsed') {
                                        return (
                                            <Tooltip key={chat.id}>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={`/chat/${chat.id}`}
                                                        prefetch="hover"
                                                        cacheFor="5m"
                                                        className={cn(
                                                            'flex h-6 w-6 items-center justify-center rounded transition-colors',
                                                            currentChatId === chat.id
                                                                ? 'bg-accent text-accent-foreground'
                                                                : 'hover:bg-accent hover:text-accent-foreground',
                                                        )}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>{chat.title}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    // Expanded state - full chat item
                                    const chatItem = (
                                        <div key={chat.id} className="group/chat relative">
                                            {editingChatId === chat.id ? (
                                                // Edit mode
                                                <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm">
                                                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                                    <Input
                                                        ref={editInputRef}
                                                        value={data.title}
                                                        onChange={(e) => setData('title', e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                saveTitle(chat.id);
                                                            } else if (e.key === 'Escape') {
                                                                cancelEditing();
                                                            }
                                                        }}
                                                        className="h-6 flex-1 text-xs"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 hover:bg-green-50 dark:hover:bg-green-950/20"
                                                        onClick={() => saveTitle(chat.id)}
                                                        disabled={processing}
                                                    >
                                                        <Check className="h-3 w-3 text-green-600 transition-colors hover:text-green-700" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={cancelEditing}>
                                                        <X className="text-muted-foreground h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                // View mode
                                                <>
                                                    <Link
                                                        href={`/chat/${chat.id}`}
                                                        prefetch="hover"
                                                        cacheFor="5m"
                                                        className={cn(
                                                            'group flex h-14 cursor-pointer items-center gap-2 rounded-[10px] px-2 transition-colors',
                                                            currentChatId === chat.id && 'bg-[var(--background-white-main)]',
                                                        )}
                                                    >
                                                        <div className="relative">
                                                            <div className="h-8 w-8 rounded-full flex items-center justify-center relative bg-[var(--icon-primary)]">
                                                                <div className="relative overflow-hidden h-4 w-4 object-cover opacity-100 brightness-100 dark:brightness-0">
                                                                    <MessageSquare fill="true" className="h-4 w-4 flex-shrink-0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="max-w-[140px] truncate text-sm font-medium">{chat.title}</span>
                                                            <span className="max-w-[140px] truncate text-xs font-medium">
                                                                {formatDistance(chat.created_at, new Date(), { addSuffix: true, locale: ptLocale })}
                                                            </span>
                                                        </div>
                                                        {/* Fade overlay for long titles */}
                                                        <div
                                                            className={cn(
                                                                'pointer-events-none absolute top-0 right-16 bottom-0 w-8 bg-gradient-to-l to-transparent transition-colors',
                                                                currentChatId === chat.id
                                                                    ? 'from-[var(--background-white-main)]'
                                                                    : 'from-sidebar group-hover/chat:from-[var(--color-sidebar)]',
                                                            )}
                                                        />
                                                    </Link>

                                                    {/* Edit and Delete buttons - only visible on hover of this specific chat */}
                                                    <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 transition-all duration-200 group-hover/chat:opacity-100 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer"
                                                            onClick={(e) => handleEditClick(chat.id, chat.title || 'Untitled Chat', e)}
                                                        >
                                                            <Pencil className="text-muted-foreground h-3 w-3 transition-colors hover:text-green-600" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="hover:bg-destructive/10 h-6 w-6 opacity-0 transition-all duration-200 group-hover/chat:opacity-100"
                                                                >
                                                                    <Trash2 className="text-muted-foreground hover:text-destructive h-3 w-3 transition-colors" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{chat.title}"? This action cannot be undone
                                                                        and will permanently delete the chat and all its messages.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteChat(chat.id)}
                                                                        className="bg-destructive hover:bg-destructive/90 focus:ring-destructive text-white"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );

                                    return chatItem;
                                })}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}
