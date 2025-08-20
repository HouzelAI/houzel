import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import ChatList from './chat-list';
import { Equal } from 'lucide-react';

interface AppSidebarProps {
    currentChatId?: number;
}

export function AppSidebar({ currentChatId }: AppSidebarProps) {
    const { auth } = usePage<{ auth: { user?: User } }>().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <div className="relative flex items-center mb-2">
                <div className="flex h-7 w-7 items-center justify-center cursor-pointer rounded-md hover:bg-[var(--fill-tsp-gray-main)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-panel-left size-5 text-[var(--icon-secondary)]"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></svg>
                </div>
            </div>

            <SidebarContent>
                <ChatList currentChatId={currentChatId} isAuthenticated={!!auth.user} />
            </SidebarContent>

            <SidebarFooter>{auth.user && <NavUser />}</SidebarFooter>
        </Sidebar>
    );
}
