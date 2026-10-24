import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useEffect, useId, useRef, useState } from 'react';

export type HomeFeedHighlight = {
    id: string;
    type: string;
    type_label: string;
    action_label: string;
    title: string;
    excerpt: string;
    image_url: string | null;
    cover_play_overlay: boolean;
    /** Preenchido quando a própria arte já traz a mensagem, como a meditação do dia. */
    cover_overlay_text?: string | null;
    href: string;
};

export type HomeFeedFallback = {
    href: string | null;
    title: string;
    excerpt: string;
    imageUrl: string;
    actionLabel: string;
};

type Props = {
    items: HomeFeedHighlight[];
    appUrl?: string;
    fallback: HomeFeedFallback;
};

type SlideKind = 'photo' | 'art' | 'text';

const slideFrameClass =
    'relative block h-[14.5rem] cursor-pointer overflow-hidden rounded-[1.25rem] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 sm:h-64 md:h-80 lg:h-[22rem]';

function plain(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function imageSrc(url: string, appUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const base = appUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}${url}`;
}

function kindFor(imageUrl: string | null, overlay: string | null | undefined): SlideKind {
    if (!imageUrl) {
        return 'text';
    }
    return plain(overlay ?? '') !== '' ? 'art' : 'photo';
}

function PlayMark() {
    return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30">
            <PlayIcon className="ml-0.5 h-3.5 w-3.5" aria-hidden />
        </span>
    );
}

function ActionPill({ label, tone }: { label: string; tone: 'on-photo' | 'on-paper' }) {
    if (label === '') {
        return null;
    }

    return (
        <span
            className={`mt-3 inline-flex w-fit max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                tone === 'on-photo'
                    ? 'bg-brand-700 text-white'
                    : 'bg-brand-700 text-white dark:bg-brand-300 dark:text-brand-950'
            }`}
        >
            <span className="truncate">{label}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
        </span>
    );
}

function TextSlide({
    kicker,
    title,
    excerpt,
    action,
}: {
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
}) {
    return (
        <div className="flex h-full flex-col justify-end bg-[#f6f3ec] px-4 pb-4 pt-4 dark:bg-zinc-900">
            {kicker !== '' ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800 dark:text-brand-200">
                    {kicker}
                </p>
            ) : null}
            <p className="mt-1 line-clamp-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-zinc-50">
                {title}
            </p>
            {excerpt !== '' && excerpt !== title ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">
                    {excerpt}
                </p>
            ) : null}
            <ActionPill label={action} tone="on-paper" />
        </div>
    );
}

function PhotoSlide({
    src,
    kicker,
    title,
    excerpt,
    action,
    showPlay,
    priority,
    onMissing,
}: {
    src: string;
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    showPlay: boolean;
    priority: boolean;
    onMissing: () => void;
}) {
    return (
        <div className="relative h-full bg-zinc-900">
            <img
                src={src}
                alt=""
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={onMissing}
                className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
            />
            <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/28 to-black/5"
                aria-hidden
            />
            {showPlay ? (
                <span className="absolute right-3 top-3 z-10">
                    <PlayMark />
                </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pr-16 pt-16 text-white">
                {kicker !== '' ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">{kicker}</p>
                ) : null}
                <p className="mt-1 line-clamp-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-tight">
                    {title}
                </p>
                {excerpt !== '' && excerpt !== title ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-white/85">{excerpt}</p>
                ) : null}
                <ActionPill label={action} tone="on-photo" />
            </div>
        </div>
    );
}

function ArtSlide({
    src,
    label,
    showPlay,
    priority,
    onMissing,
}: {
    src: string;
    label: string;
    showPlay: boolean;
    priority: boolean;
    onMissing: () => void;
}) {
    return (
        <div className="relative h-full bg-[#f3f0e8] dark:bg-zinc-900">
            <img
                src={src}
                alt=""
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={onMissing}
                className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {showPlay ? (
                <span className="absolute right-3 top-3 z-10">
                    <PlayMark />
                </span>
            ) : (
                <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm">
                    <ChevronRightIcon className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </span>
            )}
            <span className="sr-only">{label}</span>
        </div>
    );
}

function SlideFace({
    kind,
    kicker,
    title,
    excerpt,
    action,
    imageUrl,
    showPlay,
    priority,
    appUrl,
}: {
    kind: SlideKind;
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    imageUrl: string | null;
    showPlay: boolean;
    priority: boolean;
    appUrl: string;
}) {
    const [missing, setMissing] = useState(false);

    if (kind === 'text' || missing || !imageUrl) {
        return <TextSlide kicker={kicker} title={title} excerpt={excerpt} action={action} />;
    }

    if (kind === 'art') {
        return (
            <ArtSlide
                src={imageSrc(imageUrl, appUrl)}
                label={title}
                showPlay={showPlay}
                priority={priority}
                onMissing={() => setMissing(true)}
            />
        );
    }

    return (
        <PhotoSlide
            src={imageSrc(imageUrl, appUrl)}
            kicker={kicker}
            title={title}
            excerpt={excerpt}
            action={action}
            showPlay={showPlay}
            priority={priority}
            onMissing={() => setMissing(true)}
        />
    );
}

export default function HomeFeedCarousel({ items, appUrl = '', fallback }: Props) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const labelId = useId();
    const slides = items.filter((item) => plain(item.title) !== '' && item.href.trim() !== '').slice(0, 5);
    const many = slides.length > 1;

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el || !many) {
            return;
        }

        el.scrollLeft = 0;
        setActiveIndex(0);

        const updateActive = () => {
            const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-feed-slide]'));
            if (nodes.length === 0) {
                return;
            }
            const mid = el.scrollLeft + el.clientWidth / 2;
            let best = 0;
            let bestDist = Number.POSITIVE_INFINITY;
            nodes.forEach((child, index) => {
                const center = child.offsetLeft + child.offsetWidth / 2;
                const dist = Math.abs(center - mid);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = index;
                }
            });
            setActiveIndex(best);
        };

        updateActive();
        el.addEventListener('scroll', updateActive, { passive: true });
        window.addEventListener('resize', updateActive);
        return () => {
            el.removeEventListener('scroll', updateActive);
            window.removeEventListener('resize', updateActive);
        };
    }, [many, slides.length]);

    const scrollTo = (index: number) => {
        const el = scrollerRef.current;
        const node = el?.querySelectorAll<HTMLElement>('[data-feed-slide]')[index];
        if (!el || !node) {
            return;
        }
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollTo({
            left: node.offsetLeft,
            behavior: reduce ? 'auto' : 'smooth',
        });
    };

    if (slides.length === 0) {
        const title = plain(fallback.title);
        const excerpt = plain(fallback.excerpt);
        const action = fallback.href ? plain(fallback.actionLabel) : '';
        const face = (
            <SlideFace
                kind={fallback.imageUrl ? 'photo' : 'text'}
                kicker=""
                title={title}
                excerpt={excerpt}
                action={action}
                imageUrl={fallback.imageUrl || null}
                showPlay={false}
                priority
                appUrl={appUrl}
            />
        );

        return (
            <section aria-label="Novidades da comunidade" className="min-w-0">
                {fallback.href ? (
                    <Link href={fallback.href} className={slideFrameClass}>
                        {face}
                    </Link>
                ) : (
                    <div className={slideFrameClass}>{face}</div>
                )}
            </section>
        );
    }

    const activeTitle = plain(slides[activeIndex]?.title ?? slides[0]?.title ?? '');

    return (
        <section
            aria-roledescription={many ? 'carrossel' : undefined}
            aria-labelledby={labelId}
            className="min-w-0"
            onKeyDown={(event) => {
                if (!many) {
                    return;
                }
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    scrollTo(Math.min(activeIndex + 1, slides.length - 1));
                }
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    scrollTo(Math.max(activeIndex - 1, 0));
                }
            }}
        >
            <h2 id={labelId} className="sr-only">
                Novidades da comunidade
            </h2>
            <div className="relative">
                <div
                    ref={scrollerRef}
                    className={`flex min-w-0 touch-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 ${
                        many
                            ? 'snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto'
                            : 'overflow-hidden'
                    }`}
                    tabIndex={many ? 0 : undefined}
                >
                    {slides.map((item, index) => {
                        const title = plain(item.title);
                        const excerpt = plain(item.excerpt);
                        const action = plain(item.action_label);
                        const kicker = plain(item.type_label);
                        const kind = kindFor(item.image_url, item.cover_overlay_text);
                        const videoNote = item.cover_play_overlay ? ', vídeo' : '';
                        const label = `${kicker !== '' ? `${kicker}: ` : ''}${title}${videoNote}`;

                        return (
                            <div
                                key={item.id}
                                data-feed-slide
                                className="w-full shrink-0 snap-start snap-always"
                                aria-hidden={many && index !== activeIndex ? true : undefined}
                            >
                                <Link
                                    href={item.href}
                                    aria-label={label}
                                    tabIndex={many && index !== activeIndex ? -1 : undefined}
                                    className={slideFrameClass}
                                >
                                    <SlideFace
                                        kind={kind}
                                        kicker={kicker}
                                        title={title}
                                        excerpt={excerpt}
                                        action={kind === 'art' ? '' : action}
                                        imageUrl={item.image_url}
                                        showPlay={item.cover_play_overlay}
                                        priority={index === 0}
                                        appUrl={appUrl}
                                    />
                                </Link>
                            </div>
                        );
                    })}
                </div>
                {many ? (
                    <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1.5">
                        {slides.map((dot, dotIndex) => (
                            <button
                                key={dot.id}
                                type="button"
                                aria-label={`Publicação ${dotIndex + 1} de ${slides.length}: ${plain(dot.title)}`}
                                aria-current={dotIndex === activeIndex ? 'true' : undefined}
                                onClick={() => scrollTo(dotIndex)}
                                className={`cursor-pointer rounded-full transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                    dotIndex === activeIndex ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/55 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
            {many ? (
                <p className="sr-only" aria-live="polite">
                    {`Publicação ${activeIndex + 1} de ${slides.length}: ${activeTitle}`}
                </p>
            ) : null}
        </section>
    );
}
