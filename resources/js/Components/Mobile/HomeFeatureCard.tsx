import { homeFeatureCardMedia } from '@/data/homeFeatureCardMedia';
import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type Props = {
    mediaId: string;
    title: string;
    subtitle: string;
    icon: MenuIcon;
    href?: string;
    onClick?: () => void;
    spotlight?: boolean;
    pendingCount?: number | null;
    bookmark?: ReactNode;
};

const cardClass = (spotlight: boolean) =>
    `group relative flex h-full min-h-[12.25rem] w-full cursor-pointer flex-col self-stretch overflow-hidden rounded-2xl border bg-white text-left font-[inherit] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:bg-zinc-900 sm:min-h-[13rem] lg:min-h-[13.75rem] ${
        spotlight ? 'border-brand-600/40 dark:border-brand-400/40' : 'border-zinc-200 dark:border-zinc-800'
    }`;

const onPhotoShadow = '[text-shadow:0_1px_2px_rgb(0_0_0/0.35)]';

function CardPhoto({ src, focus }: { src?: string; focus?: string }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!src) {
            setReady(false);
            return;
        }

        let cancelled = false;
        const image = new Image();
        image.onload = () => {
            if (!cancelled) {
                setReady(true);
            }
        };
        image.onerror = () => {
            if (!cancelled) {
                setReady(false);
            }
        };
        image.src = src;

        return () => {
            cancelled = true;
        };
    }, [src]);

    return (
        <div className="pointer-events-none absolute inset-0 bg-[#f6f3ec] dark:bg-zinc-800" aria-hidden>
            {ready && src ? (
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: focus ?? 'center 62%' }}
                />
            ) : null}
        </div>
    );
}

export default function HomeFeatureCard({
    mediaId,
    title,
    subtitle,
    icon: Icon,
    href,
    onClick,
    spotlight = false,
    pendingCount = null,
    bookmark = null,
}: Props) {
    const media = homeFeatureCardMedia[mediaId];
    const showChevron = !bookmark && !spotlight;

    const body = (
        <>
            <CardPhoto src={media?.src} focus={media?.focus} />
            <div className="relative z-10 flex flex-1 flex-col pb-3 pl-3 pr-9 pt-3">
                {spotlight ? (
                    <span className="absolute right-2 top-2 z-20 inline-flex items-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white dark:bg-brand-300 dark:text-brand-950">
                        New
                    </span>
                ) : null}
                {bookmark}
                {showChevron ? (
                    <ChevronRightIcon
                        className={`pointer-events-none absolute right-2.5 top-3 z-10 h-4 w-4 text-white ${onPhotoShadow}`}
                        aria-hidden
                        strokeWidth={1.75}
                    />
                ) : null}
                <div className="flex min-w-0 items-start gap-2.5">
                    <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-brand-800 shadow-sm">
                        <Icon className="h-4 w-4" aria-hidden strokeWidth={1.6} />
                        {pendingCount !== null && pendingCount > 0 ? (
                            <span
                                className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white"
                                title={`${pendingCount} ${pendingCount === 1 ? 'mensagem pendente' : 'mensagens pendentes'}`}
                                aria-label={`${pendingCount} ${pendingCount === 1 ? 'mensagem pendente de responder' : 'mensagens pendentes de responder'}`}
                            >
                                {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                        ) : null}
                    </span>
                    <div className={`min-w-0 flex-1 text-white ${onPhotoShadow}`}>
                        <p className="line-clamp-2 break-words text-[15px] font-semibold leading-tight tracking-tight">
                            {title}
                        </p>
                        <p className="mt-1 line-clamp-2 break-words text-[13px] font-medium leading-snug">{subtitle}</p>
                    </div>
                </div>
            </div>
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClass(spotlight)}>
                {body}
            </button>
        );
    }

    if (!href) {
        return null;
    }

    return (
        <Link href={href} className={cardClass(spotlight)}>
            {body}
        </Link>
    );
}
