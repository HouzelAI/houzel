import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div> */}
            <div className="flex items-center text-lg gap-2 mb-0.5">
                <AppLogoIcon className="size-5 fill-current text-black dark:text-white" />
                <span className="truncate mb-0 leading-none font-semibold libre-baskerville">houzel</span>
            </div>
        </>
    );
}
