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

type Frame = 'pending' | 'landscape' | 'portrait' | 'missing';

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

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReduced(media.matches);
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, []);

    return reduced;
}

function PlayMark() {
    return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white shadow-sm ring-1 ring-white/40">
            <PlayIcon className="ml-0.5 h-3.5 w-3.5" aria-hidden />
        </span>
    );
}

function SlideCopy({
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
        <div className="flex min-w-0 flex-col text-white">
            {kicker !== '' ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{kicker}</p>
            ) : null}
            <p
                className={`line-clamp-2 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-tight ${
                    kicker !== '' ? 'mt-1.5' : ''
                }`}
            >
                {title}
            </p>
            {excerpt !== '' ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-white/85">{excerpt}</p>
            ) : null}
            {action !== '' ? (
                <span className="mt-3 inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-[#0d6a36] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm ring-1 ring-white/15">
                    <span className="truncate">{action}</span>
                    <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </span>
            ) : null}
        </div>
    );
}

function TextPanel({
    kicker,
    title,
    excerpt,
    action,
    showPlay,
}: {
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    showPlay: boolean;
}) {
    return (
        <div className="relative flex h-full flex-col justify-end overflow-hidden bg-[#0c3d24] px-4 pb-4 pt-4 pr-[4.75rem]">
            <div
                className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-emerald-300/10"
                aria-hidden
            />
            {showPlay ? (
                <span className="absolute right-3 top-3">
                    <PlayMark />
                </span>
            ) : null}
            <div className="relative">
                <SlideCopy kicker={kicker} title={title} excerpt={excerpt} action={action} />
            </div>
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
}: {
    src: string;
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    showPlay: boolean;
    priority: boolean;
}) {
    const [frame, setFrame] = useState<Frame>('pending');

    if (frame === 'missing') {
        return (
            <TextPanel kicker={kicker} title={title} excerpt={excerpt} action={action} showPlay={showPlay} />
        );
    }

    const portrait = frame === 'portrait';

    return (
        <div className="relative h-full bg-[#0c3d24]">
            {portrait ? (
                <div className="flex h-full">
                    <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-end px-4 pb-4 pt-4 pr-3">
                        <SlideCopy kicker={kicker} title={title} excerpt={excerpt} action={action} />
                    </div>
                    <div className="relative h-full w-[42%] shrink-0">
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            loading={priority ? 'eager' : 'lazy'}
                            decoding="async"
                            onLoad={(event) => {
                                const img = event.currentTarget;
                                const ratio =
                                    img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
                                setFrame(ratio < 0.92 ? 'portrait' : 'landscape');
                            }}
                            onError={() => setFrame('missing')}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0c3d24] to-transparent"
                            aria-hidden
                        />
                        {showPlay ? (
                            <span className="absolute right-2.5 top-2.5">
                                <PlayMark />
                            </span>
                        ) : null}
                    </div>
                </div>
            ) : (
                <>
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding="async"
                        onLoad={(event) => {
                            const img = event.currentTarget;
                            const ratio = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
                            setFrame(ratio < 0.92 ? 'portrait' : 'landscape');
                        }}
                        onError={() => setFrame('missing')}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${
                            frame === 'pending' ? 'opacity-0' : 'opacity-100'
                        }`}
                    />
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
                        aria-hidden
                    />
                    {showPlay ? (
                        <span className="absolute right-3 top-3 z-10">
                            <PlayMark />
                        </span>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pr-[4.75rem] pt-10">
                        <SlideCopy kicker={kicker} title={title} excerpt={excerpt} action={action} />
                    </div>
                </>
            )}
        </div>
    );
}

function SlideFace({
    kicker,
    title,
    excerpt,
    action,
    imageUrl,
    showPlay,
    priority,
    appUrl,
}: {
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    imageUrl: string | null;
    showPlay: boolean;
    priority: boolean;
    appUrl: string;
}) {
    if (!imageUrl) {
        return <TextPanel kicker={kicker} title={title} excerpt={excerpt} action={action} showPlay={showPlay} />;
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
        />
    );
}

export default function HomeFeedCarousel({ items, appUrl = '', fallback }: Props) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const reducedMotion = usePrefersReducedMotion();
    const labelId = useId();
    const slides = items.filter((item) => plain(item.title) !== '' && item.href.trim() !== '');
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
        el.scrollTo({
            left: node.offsetLeft,
            behavior: reducedMotion ? 'auto' : 'smooth',
        });
    };

    if (slides.length === 0) {
        const title = plain(fallback.title);
        const excerpt = plain(fallback.excerpt);
        const action = fallback.href ? plain(fallback.actionLabel) : '';
        const face = (
            <SlideFace
                kicker=""
                title={title}
                excerpt={excerpt}
                action={action}
                imageUrl={fallback.imageUrl}
                showPlay={false}
                priority
                appUrl={appUrl}
            />
        );

        return (
            <section aria-label="Novidades da comunidade" className="min-w-0">
                {fallback.href ? (
                    <Link
                        href={fallback.href}
                        className="block h-[12.75rem] cursor-pointer overflow-hidden rounded-[1.35rem] shadow-[0_12px_28px_-18px_rgba(12,61,36,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 sm:h-[13.25rem]"
                    >
                        {face}
                    </Link>
                ) : (
                    <div className="h-[12.75rem] overflow-hidden rounded-[1.35rem] shadow-[0_12px_28px_-18px_rgba(12,61,36,0.55)] sm:h-[13.25rem]">
                        {face}
                    </div>
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
                                    className="relative block h-[12.75rem] cursor-pointer overflow-hidden rounded-[1.35rem] shadow-[0_12px_28px_-18px_rgba(12,61,36,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-[13.25rem]"
                                >
                                    <SlideFace
                                        kicker={kicker}
                                        title={title}
                                        excerpt={excerpt}
                                        action={action}
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
                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1.5">
                        {slides.map((dot, dotIndex) => (
                            <button
                                key={dot.id}
                                type="button"
                                aria-label={`Publicação ${dotIndex + 1} de ${slides.length}: ${plain(dot.title)}`}
                                aria-current={dotIndex === activeIndex ? 'true' : undefined}
                                onClick={() => scrollTo(dotIndex)}
                                className={`cursor-pointer rounded-full transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                                    dotIndex === activeIndex
                                        ? 'h-1.5 w-4 bg-white'
                                        : 'h-1.5 w-1.5 bg-white/55 hover:bg-white/80'
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
