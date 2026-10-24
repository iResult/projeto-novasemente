import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useEffect, useId, useRef, useState } from 'react';

export type HomeFeedPresentation = 'photo' | 'art' | 'video' | 'text' | 'safe';

export type HomeFeedHighlight = {
    id: string;
    type: string;
    type_label: string;
    action_label: string;
    title: string;
    excerpt: string;
    image_url: string | null;
    cover_play_overlay: boolean;
    /** Preenchido quando a própria arte já traz a mensagem. A meditação do dia usa o título por cima. */
    cover_overlay_text?: string | null;
    presentation?: HomeFeedPresentation;
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

const slideFrameClass =
    'relative block cursor-pointer overflow-hidden rounded-[1.25rem] bg-[#f6f3ec] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 dark:bg-zinc-900';

const mediaFrameClass = 'relative h-[14.5rem] overflow-hidden sm:h-64 md:h-80 lg:h-[22rem]';

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

function presentationOf(item: Pick<HomeFeedHighlight, 'image_url' | 'cover_play_overlay' | 'cover_overlay_text' | 'presentation'>): HomeFeedPresentation {
    if (
        item.presentation === 'photo' ||
        item.presentation === 'art' ||
        item.presentation === 'video' ||
        item.presentation === 'text' ||
        item.presentation === 'safe'
    ) {
        return item.presentation;
    }
    if (!item.image_url) {
        return 'text';
    }
    if (item.cover_play_overlay) {
        return 'video';
    }
    if (plain(item.cover_overlay_text ?? '') !== '') {
        return 'art';
    }
    return 'safe';
}

function PlayMark() {
    return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30">
            <PlayIcon className="ml-0.5 h-3.5 w-3.5" aria-hidden />
        </span>
    );
}

function ActionPill({ label }: { label: string }) {
    if (label === '') {
        return null;
    }

    return (
        <span className="mt-3 inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-brand-700 px-3 py-1.5 text-[12px] font-semibold text-white">
            <span className="truncate">{label}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
        </span>
    );
}

const onPhotoShadow = '[text-shadow:0_1px_2px_rgb(0_0_0/0.35)]';

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
        <div className={`${mediaFrameClass} flex flex-col justify-end bg-[#f6f3ec] px-4 pb-4 pt-4 dark:bg-zinc-900`}>
            {kicker !== '' ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800 dark:text-brand-200">{kicker}</p>
            ) : null}
            <p className="mt-1 line-clamp-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-zinc-50">
                {title}
            </p>
            {excerpt !== '' && excerpt !== title ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">{excerpt}</p>
            ) : null}
            <ActionPill label={action} />
        </div>
    );
}

function ArtMedia({
    src,
    priority,
    onMissing,
}: {
    src: string;
    priority: boolean;
    onMissing: () => void;
}) {
    return (
        <div className={`${mediaFrameClass} bg-[#f6f3ec] dark:bg-zinc-900`}>
            <img
                src={src}
                alt=""
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={onMissing}
                className="absolute inset-0 h-full w-full object-contain object-center"
            />
        </div>
    );
}

function OverlayCopy({ kicker, title }: { kicker: string; title: string }) {
    return (
        <div className={`absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-16 text-white ${onPhotoShadow}`}>
            {kicker !== '' ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{kicker}</p>
            ) : null}
            <p className={`line-clamp-2 text-[1.15rem] font-semibold leading-snug ${kicker !== '' ? 'mt-1' : ''}`}>{title}</p>
        </div>
    );
}

function PhotoSlide({
    src,
    kicker,
    title,
    excerpt,
    action,
    priority,
    onMissing,
}: {
    src: string;
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    priority: boolean;
    onMissing: () => void;
}) {
    return (
        <div className={`${mediaFrameClass} bg-zinc-900`}>
            <img
                src={src}
                alt=""
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={onMissing}
                className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
            />
            <div className={`absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-16 text-white ${onPhotoShadow}`}>
                {kicker !== '' ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{kicker}</p>
                ) : null}
                <p className="mt-1 line-clamp-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-tight">{title}</p>
                {excerpt !== '' && excerpt !== title ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-white">{excerpt}</p>
                ) : null}
                <ActionPill label={action} />
            </div>
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
    priority,
    appUrl,
}: {
    kind: HomeFeedPresentation;
    kicker: string;
    title: string;
    excerpt: string;
    action: string;
    imageUrl: string | null;
    priority: boolean;
    appUrl: string;
}) {
    const [missing, setMissing] = useState(false);
    const showMedia = !missing && imageUrl && kind !== 'text';

    if (!showMedia) {
        return <TextSlide kicker={kicker} title={title} excerpt={excerpt} action={action} />;
    }

    const src = imageSrc(imageUrl, appUrl);

    if (kind === 'photo') {
        return (
            <PhotoSlide
                src={src}
                kicker={kicker}
                title={title}
                excerpt={excerpt}
                action={action}
                priority={priority}
                onMissing={() => setMissing(true)}
            />
        );
    }

    if (kind === 'art') {
        return (
            <>
                <ArtMedia src={src} priority={priority} onMissing={() => setMissing(true)} />
                <span className="sr-only">{title}</span>
            </>
        );
    }

    return (
        <div className={`${mediaFrameClass} bg-zinc-900`}>
            <img
                src={src}
                alt=""
                draggable={false}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => setMissing(true)}
                className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {kind === 'video' ? (
                <span className="absolute right-3 top-3 z-10">
                    <PlayMark />
                </span>
            ) : null}
            <OverlayCopy kicker={kicker} title={title} />
        </div>
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
                kind={fallback.imageUrl ? 'safe' : 'text'}
                kicker=""
                title={title}
                excerpt={excerpt}
                action={action}
                imageUrl={fallback.imageUrl || null}
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
            <div
                ref={scrollerRef}
                className={`flex min-w-0 touch-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 ${
                    many ? 'snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto' : 'overflow-hidden'
                }`}
                tabIndex={many ? 0 : undefined}
            >
                {slides.map((item, index) => {
                    const title = plain(item.title);
                    const excerpt = plain(item.excerpt);
                    const action = plain(item.action_label);
                    const kicker = plain(item.type_label);
                    const kind = presentationOf(item);
                    const videoNote = kind === 'video' ? ', vídeo' : '';
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
                                    action={kind === 'photo' || kind === 'text' ? action : ''}
                                    imageUrl={item.image_url}
                                    priority={index === 0}
                                    appUrl={appUrl}
                                />
                            </Link>
                        </div>
                    );
                })}
            </div>
            {many ? (
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    {slides.map((dot, dotIndex) => (
                        <button
                            key={dot.id}
                            type="button"
                            aria-label={`Publicação ${dotIndex + 1} de ${slides.length}: ${plain(dot.title)}`}
                            aria-current={dotIndex === activeIndex ? 'true' : undefined}
                            onClick={() => scrollTo(dotIndex)}
                            className={`cursor-pointer rounded-full transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 ${
                                dotIndex === activeIndex
                                    ? 'h-1.5 w-4 bg-zinc-800 dark:bg-zinc-100'
                                    : 'h-1.5 w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-400'
                            }`}
                        />
                    ))}
                </div>
            ) : null}
            {many ? (
                <p className="sr-only" aria-live="polite">
                    {`Publicação ${activeIndex + 1} de ${slides.length}: ${activeTitle}`}
                </p>
            ) : null}
        </section>
    );
}
