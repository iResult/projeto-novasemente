import { homeFeatureCardMedia, type HomeCardPresentation } from '@/data/homeFeatureCardMedia';
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
    /** Ajuste desta fotografia. Sem isso, o card segue a mídia atual da Home. */
    presentation?: HomeCardPresentation;
    /** Proporção fixa do mosaico. O card legado continua com a altura mínima atual. */
    framed?: boolean;
    /**
     * `legacy` é o card atual (voluntariado).
     * `photo` é a fotografia com texto na base.
     * `plain` é o card claro, sem imagem.
     */
    layout?: 'legacy' | 'photo' | 'plain';
};

const cardClass = (spotlight: boolean, framed: boolean) =>
    `group relative flex h-full w-full cursor-pointer flex-col self-stretch overflow-hidden rounded-2xl border bg-white text-left font-[inherit] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:bg-zinc-900 ${
        framed ? 'aspect-[4/5] min-w-0' : 'min-h-[12.25rem] sm:min-h-[13rem] lg:min-h-[13.75rem]'
    } ${spotlight ? 'border-brand-600/40 dark:border-brand-400/40' : 'border-zinc-200 dark:border-zinc-800'}`;

const onPhotoShadow = '[text-shadow:0_1px_2px_rgb(0_0_0/0.35)]';

function CardPhoto({
    src,
    focus,
    fallbackSrc,
}: {
    src?: string;
    focus?: string;
    fallbackSrc?: string;
}) {
    const [activeSrc, setActiveSrc] = useState(src);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setActiveSrc(src);
    }, [src]);

    useEffect(() => {
        if (!activeSrc) {
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
            if (cancelled) {
                return;
            }
            if (fallbackSrc && activeSrc !== fallbackSrc) {
                setActiveSrc(fallbackSrc);
                return;
            }
            setReady(false);
        };
        image.src = activeSrc;

        return () => {
            cancelled = true;
        };
    }, [activeSrc, fallbackSrc]);

    return (
        <div className="pointer-events-none absolute inset-0 bg-[#f6f3ec] dark:bg-zinc-800" aria-hidden>
            {ready && activeSrc ? (
                <img
                    src={activeSrc}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: focus ?? 'center 62%' }}
                />
            ) : null}
        </div>
    );
}

function CardShell({
    href,
    onClick,
    className,
    children,
}: {
    href?: string;
    onClick?: () => void;
    className: string;
    children: ReactNode;
}) {
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={className}>
                {children}
            </button>
        );
    }

    if (!href) {
        return null;
    }

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
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
    presentation,
    framed = false,
    layout = 'legacy',
}: Props) {
    const media = homeFeatureCardMedia[mediaId];
    const showChevron = !bookmark && !spotlight;
    const textTheme = presentation?.textTheme ?? 'light';
    const onLightPhoto = textTheme === 'dark';
    const titleClass = onLightPhoto
        ? 'text-zinc-950'
        : `text-white ${onPhotoShadow}`;
    const subtitleClass = onLightPhoto
        ? 'text-zinc-700'
        : `text-white ${onPhotoShadow}`;
    const mosaicClass = `group relative flex h-full w-full cursor-pointer flex-col self-stretch overflow-hidden rounded-2xl border text-left font-[inherit] shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 aspect-[4/5] min-w-0 md:hover:-translate-y-0.5 md:hover:shadow-md ${
        spotlight ? 'border-brand-600/40 dark:border-brand-400/40' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
    }`;

    const iconBadge = (
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
    );

    if (layout === 'plain') {
        return (
            <CardShell href={href} onClick={onClick} className={`${mosaicClass} bg-[#f6f3ec] dark:bg-zinc-900`}>
                {bookmark}
                <div className="relative z-10 flex flex-1 flex-col p-3.5">
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-800 ring-1 ring-zinc-200/90 dark:bg-zinc-800 dark:text-brand-200 dark:ring-zinc-700">
                        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.6} />
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
                    <p className="mt-3 line-clamp-2 break-words text-[15px] font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
                        {title}
                    </p>
                    <p className="mt-1 line-clamp-4 break-words text-[13px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">
                        {subtitle}
                    </p>
                    <ChevronRightIcon
                        className="mt-auto h-4 w-4 self-end text-zinc-400 dark:text-zinc-500"
                        aria-hidden
                        strokeWidth={1.75}
                    />
                </div>
            </CardShell>
        );
    }

    if (layout === 'photo') {
        return (
            <CardShell href={href} onClick={onClick} className={`${mosaicClass} bg-zinc-900`}>
                <CardPhoto
                    src={presentation?.image ?? media?.src}
                    focus={presentation?.imagePosition ?? media?.focus}
                    fallbackSrc={presentation?.fallbackImage}
                />
                <div
                    className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[40%] ${
                        onLightPhoto
                            ? 'bg-gradient-to-t from-white/85 via-white/35 to-transparent'
                            : 'bg-gradient-to-t from-black/75 via-black/40 to-transparent'
                    }`}
                    aria-hidden
                />
                {bookmark}
                <span className="absolute left-3 top-3 z-20">{iconBadge}</span>
                {spotlight ? (
                    <span className="absolute left-14 top-4 z-20 inline-flex items-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        New
                    </span>
                ) : null}
                <div className="relative z-10 mt-auto flex flex-col pb-3 pl-3 pr-8 pt-16">
                    <p className={`line-clamp-2 break-words text-[15px] font-semibold leading-tight tracking-tight ${titleClass}`}>
                        {title}
                    </p>
                    <p className={`mt-1 line-clamp-2 break-words text-[13px] font-medium leading-snug ${subtitleClass}`}>
                        {subtitle}
                    </p>
                </div>
                <ChevronRightIcon
                    className={`pointer-events-none absolute bottom-3 right-2.5 z-10 h-4 w-4 ${
                        onLightPhoto ? 'text-zinc-800' : `text-white ${onPhotoShadow}`
                    }`}
                    aria-hidden
                    strokeWidth={1.75}
                />
            </CardShell>
        );
    }

    const body = (
        <>
            <CardPhoto
                src={presentation?.image ?? media?.src}
                focus={presentation?.imagePosition ?? media?.focus}
                fallbackSrc={presentation?.fallbackImage}
            />
            {presentation?.gradientVariant === 'soft' || presentation?.gradientVariant === 'read' ? (
                <div
                    className={`pointer-events-none absolute inset-x-0 top-0 z-[1] ${
                        presentation.gradientVariant === 'read' ? 'h-[58%]' : 'h-[46%]'
                    } ${
                        onLightPhoto
                            ? 'bg-gradient-to-b from-white/75 via-white/25 to-transparent'
                            : presentation.gradientVariant === 'read'
                              ? 'bg-gradient-to-b from-black/75 via-black/45 to-transparent'
                              : 'bg-gradient-to-b from-black/60 via-black/25 to-transparent'
                    }`}
                    aria-hidden
                />
            ) : null}
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
                    <div className="min-w-0 flex-1">
                        <p className={`line-clamp-2 break-words text-[15px] font-semibold leading-tight tracking-tight ${titleClass}`}>
                            {title}
                        </p>
                        <p
                            className={`mt-1 break-words text-[13px] font-medium leading-snug ${
                                framed ? 'line-clamp-4' : 'line-clamp-2'
                            } ${subtitleClass}`}
                        >
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClass(spotlight, framed)}>
                {body}
            </button>
        );
    }

    if (!href) {
        return null;
    }

    return (
        <Link href={href} className={cardClass(spotlight, framed)}>
            {body}
        </Link>
    );
}
