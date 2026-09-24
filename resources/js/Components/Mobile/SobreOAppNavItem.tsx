import SobreOAppModal from '@/Components/Mobile/SobreOAppModal';
import { useMinWidthMd } from '@/hooks/useMinWidthMd';
import { Link } from '@inertiajs/react';
import { BookOpenIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const settingsRowClass =
    'block w-full px-4 py-3 text-left text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800';

const moreCardClass =
    'group flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-zinc-200/80 transition duration-200 hover:bg-zinc-50 hover:shadow-md hover:ring-zinc-300/90 active:bg-zinc-100/80 dark:bg-zinc-900 dark:ring-zinc-700/70 dark:hover:bg-zinc-800/60 dark:hover:ring-zinc-600/70';

const homeFooterClass =
    'group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-left text-zinc-600 transition hover:bg-zinc-100/80 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35 active:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 dark:focus-visible:ring-emerald-300/40 dark:active:bg-zinc-800';

function HomeFooterContent() {
    return (
        <>
            <BookOpenIcon className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden strokeWidth={1.75} />
            <span className="min-w-0 flex-1 text-sm font-medium leading-tight">Sobre o app</span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
        </>
    );
}

export default function SobreOAppNavItem({
    variant,
    from,
}: {
    variant: 'settings' | 'more' | 'home-footer';
    from?: 'settings';
}) {
    const isDesktop = useMinWidthMd();
    const [open, setOpen] = useState(false);
    const href = route('mobile.sobre-o-app', from === 'settings' ? { from: 'settings' } : {});

    if (variant === 'settings') {
        if (isDesktop) {
            return (
                <>
                    <button type="button" className={settingsRowClass} onClick={() => setOpen(true)}>
                        Sobre o APP
                    </button>
                    <SobreOAppModal show={open} onClose={() => setOpen(false)} />
                </>
            );
        }
        return (
            <Link href={href} className={settingsRowClass}>
                Sobre o APP
            </Link>
        );
    }

    if (variant === 'home-footer') {
        if (isDesktop) {
            return (
                <>
                    <button type="button" className={homeFooterClass} onClick={() => setOpen(true)}>
                        <HomeFooterContent />
                    </button>
                    <SobreOAppModal show={open} onClose={() => setOpen(false)} />
                </>
            );
        }

        return (
            <Link href={href} className={homeFooterClass}>
                <HomeFooterContent />
            </Link>
        );
    }

    if (isDesktop) {
        return (
            <>
                <button type="button" className={moreCardClass} onClick={() => setOpen(true)}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/60">
                        <BookOpenIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block font-semibold text-zinc-900 dark:text-white">Sobre o APP</span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            Versão, lojas, links e suporte
                        </span>
                    </div>
                </button>
                <SobreOAppModal show={open} onClose={() => setOpen(false)} />
            </>
        );
    }

    return (
        <Link href={href} className={moreCardClass}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/60">
                <BookOpenIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
                <span className="block font-semibold text-zinc-900 dark:text-white">Sobre o APP</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Versão, lojas, links e suporte
                </span>
            </div>
        </Link>
    );
}
