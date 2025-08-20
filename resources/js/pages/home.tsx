import Conversation from '@/components/conversation';
import TitleGenerator from '@/components/title-generator';
import SidebarTitleUpdater from '@/components/sidebar-title-updater';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useStream } from '@laravel/stream-react';
import { ArrowUp, Bell, Check, ChevronDown, Globe, Info } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AppLogo from '@/components/app-logo';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

export default function Home() {
    return (
        <main className='[background:linear-gradient(180deg,#FFFFFF_0%,#EDEDED_100%)] min-h-screen'>
            <div className="max-md:hidden w-full flex relative justify-center z-[40] animate-header-fade-in">
                <div className="flex justify-between items-center w-full max-w-[1600px] h-14 px-6 transition-all duration-200">
                    <div className="flex items-center gap-10 h-full cursor-pointer">
                        <div className="flex items-center gap-1 h-full">
                            <div className="flex">
                                <AppLogo />
                            </div>
                        </div>
                        <div className="flex gap-10 h-full items-center flex-wrap flex-row overflow-hidden">
                            <div className="flex items-center relative justify-center gap-1 rounded-lg clickable h-full font-medium text-[var(--text-primary)] duration-50 border border-[var(--border-btn-main)] border-none outline-none hover:opacity-70">
                                <span className='text-sm text-[var(--text-primary)]'>Casos de uso</span>
                            </div>
                            <div className="flex items-center relative justify-center gap-1 rounded-lg clickable h-full font-medium text-[var(--text-primary)] duration-50 border border-[var(--border-btn-main)] border-none outline-none hover:opacity-70">
                                <span className='text-sm text-[var(--text-primary)]'>Comunidade</span>
                            </div>
                            <div className="flex items-center relative justify-center gap-1 rounded-lg clickable h-full font-medium text-[var(--text-primary)] duration-50 border border-[var(--border-btn-main)] border-none outline-none hover:opacity-70">
                                <span className='text-sm text-[var(--text-primary)]'>Benchmarks</span>
                            </div>
                            <div className="flex items-center relative justify-center gap-1 rounded-lg clickable h-full font-medium text-[var(--text-primary)] duration-50 border border-[var(--border-btn-main)] border-none outline-none hover:opacity-70">
                                <span className='text-sm text-[var(--text-primary)]'>Preços</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-[20px]">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className='w-[max-content] gap-2 h-[32px] ps-2 pe-1 rounded-lg flex items-center justify-between hover:bg-[var(--fill-tsp-gray-main)] cursor-pointer'>
                                    <Globe />
                                    Português
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[var(--background-menu-white)] shadow-[0_4px_11px_0px_var(--shadow-S)] rounded-xl border border-[var(--border-dark)] dark:border-[var(--border-light)] min-w-[110px] max-h-[350px] overflow-auto" align="start">
                                <DropdownMenuGroup className='p-0'>
                                    <DropdownMenuItem className='flex items-center gap-2 w-full p-2 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)] cursor-pointer text-sm text-[var(--text-secondary)]'>
                                        Português
                                        <Check className='ms-auto' />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='flex items-center gap-2 w-full p-2 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)] cursor-pointer text-sm text-[var(--text-secondary)]'>
                                        English
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='flex items-center gap-2 w-full p-2 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)] cursor-pointer text-sm text-[var(--text-secondary)]'>
                                        Español
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='flex items-center gap-2 w-full p-2 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)] cursor-pointer text-sm text-[var(--text-secondary)]'>
                                        Français
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex justify-center items-center cursor-pointer relative hover:opacity-80 w-[32px] h-[32px] rounded-lg hover:bg-[var(--fill-tsp-gray-main)]">
                            <Bell size={18} />
                        </div>
                        <Button className='inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors hover:opacity-90 active:opacity-80 bg-[var(--Button-primary-black)] text-[var(--text-onblack)] h-[36px] px-[12px] gap-[6px] text-sm min-w-16 rounded-full' onClick={() => router.visit('/login')}>
                            Começar
                        </Button>
                    </div>
                </div>
            </div>
            <div id="headerCard" className='flex flex-col items-center px-0 py-6 max-md:pb-[140px]'>
                <div className="flex flex-col items-center gap-8 px-0 py-[100px] z-10 max-w-[948px] max-md:gap-4 max-md:pt-[52px] max-md:max-h-[463px] max-h-[720px]">
                    <div className="flex flex-col items-center max-md:gap-2 gap-4 self-stretch">
                        <h1 className='text-black text-center max-md:max-w-[325px] max-md:text-[28px] text-[64px] font-medium leading-[140%] max-w-[743px] font-serif animate-text-fade-in libre-baskerville'>Prazer, Houzel</h1>
                        <div className="w-[764px] max-md:max-w-[301px] max-md:text-[14px] text-[var(--text-tertiary)] text-center text-[20px] font-[400] leading-[30px] animate-text-fade-in delay-100 max-md:leading-[18px]">
                        Manus is a general AI agent that bridges minds and actions: it doesn't just think, it delivers results. Manus excels at various tasks in work and life, getting everything done while you rest.
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
