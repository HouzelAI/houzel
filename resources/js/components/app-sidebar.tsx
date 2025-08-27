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

            <SidebarContent>
                <ChatList currentChatId={currentChatId} isAuthenticated={!!auth.user} />
            </SidebarContent>

            <SidebarFooter>{auth.user && <NavUser />}</SidebarFooter>
        </Sidebar>
    );
}
