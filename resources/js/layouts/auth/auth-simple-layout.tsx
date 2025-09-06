import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="bg-black flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="absolute left-0 top-0 p-8">
                <div className="flex items-center text-lg gap-2 mb-0.5">
                    <AppLogoIcon className="size-6 fill-current text-white" />
                    <span className="truncate mb-0 leading-none text-xl text-white font-semibold libre-baskerville">houzel</span>
                </div>
            </div>
            <div className="w-full max-w-xs z-20">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <AppLogoIcon className="size-14 text-white" />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="flex flex-col items-center gap-[20px] relative">
                            <h1 className="text-[20px] font-bold text-center text-[#dadada] max-sm:text-[18px]">{title}</h1>
                            <h2 className="max-w-[384px] text-center text-[#7f7f7f] text-sm mt-[-12px]">{description}</h2>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
