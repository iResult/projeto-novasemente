import MobileLayout from '@/Layouts/MobileLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRightIcon, DevicePhoneMobileIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import ConhecaNovaSementeHomeCard from '@/Components/Mobile/ConhecaNovaSementeHomeCard';
import FaleComNovaSementeHomeCard from '@/Components/Mobile/FaleComNovaSementeHomeCard';
import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import PromiseBoxModal from '@/Components/Mobile/PromiseBoxModal';
import type { WeeklyProgramHomeCardData } from '@/Components/Mobile/WeeklyProgramHomeCard';
import SabbathHomeBanner, { type SabbathHomeBannerData } from '@/Components/Mobile/SabbathHomeBanner';
import MeditationHomeBanner, { type MeditationHomeBannerData } from '@/Components/Mobile/MeditationHomeBanner';
import { type HomeFeedHighlight } from '@/Components/Mobile/HomeFeedCarousel';
import { type HomeModuleSpotlightPayload } from '@/Components/Mobile/HomeModuleSpotlightBanner';
import AppNoveltyOverlay, {
    type PendingAppNoveltyPayload,
} from '@/Components/Mobile/AppNoveltyOverlay';
import HomeCardBookmarkButton from '@/Components/Mobile/HomeCardBookmarkButton';
import HomeShortcutSearch from '@/Components/Mobile/HomeShortcutSearch';
import {
    type DevotionalAudience,
    DEVOTIONAL_AUDIENCE_DEFAULT,
    readStoredDevotionalAudience,
} from '@/data/devotionalAudience';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { arrangeHomeCardMosaic, homeCardPhotoPresentation } from '@/data/homeCardPilot';
import { homeQuickActions } from '@/data/homeQuickActions';

interface Props {
    showPostRegistrationBanner?: boolean;
    sabbathBanner?: SabbathHomeBannerData | null;
    meditationBanner?: MeditationHomeBannerData | null;
    weeklyProgramCards?: WeeklyProgramHomeCardData[];
    feedHighlights?: HomeFeedHighlight[];
    moduleSpotlight?: HomeModuleSpotlightPayload | null;
    bookmarkedHomeCards?: string[];
    nsWhatsPendingReply?: number;
    pendingAppNovelty?: PendingAppNoveltyPayload | null;
}

type PageProps = {
    appUrl?: string;
    auth?: {
        user?: { name: string; email?: string; photo_url?: string | null } | null;
        isMinistryLeaderAccount?: boolean;
    };
    csrf_token?: string;
};

function firstName(fullName: string): string {
    const t = fullName.trim();
    if (!t) return '';
    return t.split(/\s+/)[0] ?? t;
}

export default function MobileHome({
    showPostRegistrationBanner = false,
    sabbathBanner = null,
    meditationBanner = null,
    moduleSpotlight = null,
    bookmarkedHomeCards = [],
    nsWhatsPendingReply = 0,
    pendingAppNovelty = null,
}: Props) {
    const page = usePage();
    const { appUrl = '', auth, csrf_token: csrfProp } = page.props as unknown as PageProps;
    const user = auth?.user ?? null;
    const isMinistryLeader = auth?.isMinistryLeaderAccount === true;
    const displayName = user?.name ? firstName(user.name) : '';
    const [promiseOpen, setPromiseOpen] = useState(false);
    const [bookmarks, setBookmarks] = useState<string[]>(bookmarkedHomeCards);
    const [bookmarkBusy, setBookmarkBusy] = useState(false);
    const [meditationAudience, setMeditationAudience] = useState<DevotionalAudience>(() =>
        typeof window !== 'undefined' ? readStoredDevotionalAudience() : DEVOTIONAL_AUDIENCE_DEFAULT,
    );

    useEffect(() => {
        setBookmarks(bookmarkedHomeCards);
    }, [bookmarkedHomeCards]);

    useEffect(() => {
        setMeditationAudience(readStoredDevotionalAudience());
    }, []);

    useEffect(() => {
        const syncFromStorage = () => setMeditationAudience(readStoredDevotionalAudience());
        window.addEventListener('focus', syncFromStorage);
        document.addEventListener('visibilitychange', syncFromStorage);
        return () => {
            window.removeEventListener('focus', syncFromStorage);
            document.removeEventListener('visibilitychange', syncFromStorage);
        };
    }, []);

    const openPromise = () => {
        setPromiseOpen(true);
    };

    const { isEnabled } = useAppFeatures();
    const showMeditationBanner = Boolean(meditationBanner) && isEnabled('devotional');
    const showSupport = isEnabled('support');
    const homeFooterLinkClass =
        'flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-2xl bg-white px-3 py-2 text-left shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-zinc-800/70';

    const canBookmark = Boolean(user);

    const toggleBookmark = async (cardKey: string) => {
        if (!canBookmark || bookmarkBusy) {
            return;
        }
        setBookmarkBusy(true);
        const prev = bookmarks;
        const next = prev.includes(cardKey)
            ? prev.filter((k) => k !== cardKey)
            : [cardKey, ...prev.filter((k) => k !== cardKey)];
        setBookmarks(next);

        try {
            const csrf =
                csrfProp ??
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
                '';
            const response = await fetch(route('mobile.home.bookmarks.toggle'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ card_key: cardKey }),
            });
            if (!response.ok) {
                setBookmarks(prev);
                return;
            }
            const payload = (await response.json()) as { bookmarkedHomeCards?: string[] };
            if (Array.isArray(payload.bookmarkedHomeCards)) {
                setBookmarks(payload.bookmarkedHomeCards);
            }
        } catch {
            setBookmarks(prev);
        } finally {
            setBookmarkBusy(false);
        }
    };

    const gridItems = useMemo(() => {
        const actions = homeQuickActions
            .map((action) =>
                action.id === 'caixa-promessas' ? { ...action, onClick: openPromise } : action,
            )
            .filter((action) => !action.featureKey || isEnabled(action.featureKey))
            .filter((action) => !action.leaderOnly || isMinistryLeader)
            .map((action) => ({ kind: 'action' as const, id: action.id, label: action.label, action }));

        return arrangeHomeCardMosaic(actions, bookmarks);
    }, [bookmarks, isEnabled, isMinistryLeader]);

    useEffect(() => {
        if (!showPostRegistrationBanner || typeof window === 'undefined') {
            return;
        }
        const u = new URL(window.location.href);
        if (u.searchParams.has('reg_ok')) {
            u.searchParams.delete('reg_ok');
            const next = u.pathname + (u.searchParams.toString() ? `?${u.searchParams.toString()}` : '') + u.hash;
            window.history.replaceState({}, '', next);
        }
    }, [showPostRegistrationBanner]);

    return (
        <MobileLayout allowHorizontalPan>
            <Head title="Home" />
            <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-6 sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl">
                {showPostRegistrationBanner ? (
                    <div
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-50"
                        role="status"
                    >
                        <p className="font-semibold">Conta criada com sucesso</p>
                        <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">
                            Você já está conectado(a). Explore o restante do aplicativo.
                        </p>
                    </div>
                ) : null}

                <div className={`relative z-20 flex flex-col gap-3 ${showPostRegistrationBanner ? '' : '-mt-3'}`}>
                <header className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="truncate text-xl font-semibold leading-snug tracking-tight text-zinc-900 dark:text-white">
                            {user ? <>Bem-vindo, {displayName}!</> : <>Bem-vindo!</>}
                        </p>
                    </div>
                </header>
                <HomeShortcutSearch
                    actions={homeQuickActions}
                    meditationAudience={meditationAudience}
                    isMinistryLeader={isMinistryLeader}
                    onOpenPromise={openPromise}
                />

                {/*
                    Atalhos Oferta NS, Dízimo e Pacto e Conviva — comentados para teste.
                    Restaurar: importar HomeGivingShortcuts e renderizar <HomeGivingShortcuts />.
                */}

                {/*
                    Carrossel do feed — comentado para teste.
                    Restaurar: importar HomeFeedCarousel e renderizar com items={feedHighlights}.
                */}
                </div>

                {/*
                    Programação de sábado — comentada para teste.
                    Restaurar: importar WeeklyProgramHomeStrip e renderizar quando weeklyProgramCards.length > 0.
                */}

                {showMeditationBanner && meditationBanner ? (
                    <MeditationHomeBanner
                        banner={meditationBanner}
                        appUrl={appUrl}
                        audience={meditationAudience}
                        layout="strip"
                    />
                ) : null}

                {sabbathBanner && !showMeditationBanner ? (
                    <SabbathHomeBanner banner={sabbathBanner} appUrl={appUrl} layout="strip" />
                ) : null}
                <div className="grid grid-cols-2 items-stretch gap-3 [&>:only-child]:col-span-2">
                    <ConhecaNovaSementeHomeCard />
                    <FaleComNovaSementeHomeCard pendingCount={nsWhatsPendingReply} />
                </div>
                <section aria-label="Atalhos" className="relative z-[1]">
                    <div className="grid w-full grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {gridItems.map((item) => {
                            const { id, label, subtitle, route: routeName, routeParams, onClick, icon } = item.action;
                            const isSpotlightCard = Boolean(
                                (Array.isArray(moduleSpotlight?.home_card_ids) &&
                                    moduleSpotlight.home_card_ids.includes(id)) ||
                                    moduleSpotlight?.items?.some((s) => s.home_card_id === id),
                            );
                            if (!onClick && !routeName) {
                                return null;
                            }

                            const href = onClick
                                ? undefined
                                : id === 'meditacao-diaria'
                                  ? route(routeName!, { audience: meditationAudience })
                                  : routeParams
                                    ? route(routeName!, routeParams)
                                    : route(routeName!);
                            const presentation = homeCardPhotoPresentation[id];

                            return (
                                <HomeFeatureCard
                                    key={id}
                                    mediaId={id}
                                    title={label}
                                    subtitle={subtitle}
                                    icon={icon}
                                    href={href}
                                    onClick={onClick}
                                    spotlight={isSpotlightCard}
                                    layout={presentation ? 'photo' : 'plain'}
                                    presentation={presentation}
                                    bookmark={
                                        canBookmark ? (
                                            <HomeCardBookmarkButton
                                                cardKey={id}
                                                bookmarked={bookmarks.includes(id)}
                                                disabled={bookmarkBusy}
                                                tone={presentation ? 'on-dark' : 'surface'}
                                                onToggle={(key) => void toggleBookmark(key)}
                                            />
                                        ) : null
                                    }
                                />
                            );
                        })}
                    </div>
                </section>

                <div className="mt-8 grid w-full grid-cols-2 gap-2 [&>:only-child]:col-span-2 lg:grid-cols-4 lg:[&>:only-child]:col-span-1">
                    <Link href={route('mobile.sobre-o-app')} className={homeFooterLinkClass}>
                        <DevicePhoneMobileIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden strokeWidth={1.75} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            Sobre o APP
                        </span>
                        <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block dark:text-zinc-600" aria-hidden strokeWidth={1.75} />
                    </Link>
                    {showSupport ? (
                        <Link href={route('mobile.support.index')} className={homeFooterLinkClass}>
                            <LifebuoyIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden strokeWidth={1.75} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                Suporte do App
                            </span>
                            <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block dark:text-zinc-600" aria-hidden strokeWidth={1.75} />
                        </Link>
                    ) : null}
                </div>

                <PromiseBoxModal show={promiseOpen} onClose={() => setPromiseOpen(false)} canFavorite={!!user} />
            </div>
            {user && pendingAppNovelty ? <AppNoveltyOverlay novelty={pendingAppNovelty} /> : null}
        </MobileLayout>
    );
}
