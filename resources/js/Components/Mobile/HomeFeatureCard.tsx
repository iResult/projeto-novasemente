import { homeFeatureCardMedia } from '@/data/homeFeatureCardMedia';
import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from 'react';

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

function wash(color: string, wide: boolean): string {
    const tone = (amount: number) => `color-mix(in oklab, ${color} ${amount}%, transparent)`;

    if (wide) {
        return `radial-gradient(120% 150% at 0% 42%, ${tone(96)} 0%, ${tone(90)} 24%, ${tone(72)} 42%, ${tone(44)} 58%, ${tone(18)} 74%, transparent 92%)`;
    }

    return `radial-gradient(118% 82% at 50% -6%, ${tone(96)} 0%, ${tone(91)} 24%, ${tone(74)} 40%, ${tone(48)} 54%, ${tone(24)} 68%, ${tone(8)} 82%, transparent 100%)`;
}

const cardClass = (spotlight: boolean, wide: boolean) =>
    `group relative flex h-full w-full cursor-pointer flex-col self-stretch overflow-hidden rounded-[1.35rem] border-0 bg-white p-0 text-left font-[inherit] shadow-[0_10px_28px_-18px_rgba(24,24,27,0.45)] ring-1 transition duration-200 @container hover:shadow-[0_16px_36px_-20px_rgba(24,24,27,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-[0_14px_32px_-18px_rgba(0,0,0,0.72)] dark:focus-visible:ring-brand-300/40 ${
        wide ? 'min-h-[12.75rem] sm:min-h-[14.5rem]' : 'min-h-[15.75rem] sm:min-h-[17rem] lg:min-h-[18.5rem]'
    } ${spotlight ? 'ring-brand-600/35 dark:ring-brand-400/40' : 'ring-zinc-200/90 dark:ring-zinc-800'}`;

function CardPhoto({ src, wide, focus }: { src?: string; wide: boolean; focus?: string }) {
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

    const lightWash: CSSProperties = { backgroundImage: wash('#ffffff', wide) };
    const darkWash: CSSProperties = { backgroundImage: wash('var(--color-zinc-900)', wide) };

    return (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-[#f6f3ec] to-brand-50 dark:from-brand-950 dark:via-zinc-900 dark:to-zinc-800" />
            {ready && src ? (
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.84] dark:saturate-[0.92]"
                    style={{ objectPosition: focus ?? (wide ? '68% center' : 'center 62%') }}
                />
            ) : null}
            <div className="absolute inset-0 dark:hidden" style={lightWash} />
            <div className="absolute inset-0 hidden dark:block" style={darkWash} />
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
    const wide = media?.crop === 'side';
    const showChevron = !bookmark && !spotlight;

    const body = (
        <>
            <CardPhoto src={media?.src} wide={wide} focus={media?.focus} />
            {spotlight ? (
                <span className="absolute right-2 top-2 z-20 inline-flex items-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-brand-300 dark:text-brand-950">
                    New
                </span>
            ) : null}
            {bookmark}
            {showChevron ? (
                <ChevronRightIcon
                    className="pointer-events-none absolute right-2.5 top-3 z-10 h-4 w-4 text-zinc-400 group-hover:text-brand-700 dark:text-zinc-500 dark:group-hover:text-brand-300"
                    aria-hidden
                    strokeWidth={1.75}
                />
            ) : null}
            <div
                className={`relative z-10 flex min-w-0 flex-1 items-start ${
                    wide ? 'max-w-xl gap-3 p-4 pr-10' : 'flex-col gap-2.5 p-3 pr-8 @min-[10.5rem]:flex-row @min-[10.5rem]:items-start'
                }`}
            >
                <span
                    className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200 ${
                        wide ? 'h-10 w-10' : 'h-8 w-8'
                    }`}
                >
                    <Icon className={wide ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden strokeWidth={1.6} />
                    {pendingCount !== null && pendingCount > 0 ? (
                        <span
                            className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white dark:bg-rose-500 dark:ring-zinc-900"
                            title={`${pendingCount} ${pendingCount === 1 ? 'mensagem pendente' : 'mensagens pendentes'}`}
                            aria-label={`${pendingCount} ${pendingCount === 1 ? 'mensagem pendente de responder' : 'mensagens pendentes de responder'}`}
                        >
                            {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                    ) : null}
                </span>
                <div className={`min-w-0 flex-1 ${!wide && (bookmark || spotlight) ? '@min-[10.5rem]:pt-6' : ''}`}>
                    <p className="break-words text-[15px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                        {title}
                    </p>
                    <p className="mt-1 break-words text-[13px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                </div>
            </div>
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClass(spotlight, wide)}>
                {body}
            </button>
        );
    }

    if (!href) {
        return null;
    }

    return (
        <Link href={href} className={cardClass(spotlight, wide)}>
            {body}
        </Link>
    );
}
