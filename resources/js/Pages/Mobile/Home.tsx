import MobileLayout from '@/Layouts/MobileLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BookmarkSquareIcon,
    CalendarDaysIcon,
    CameraIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    FilmIcon,
    GiftIcon,
    GlobeAltIcon,
    HeartIcon,
    MusicalNoteIcon,
    NewspaperIcon,
    PlayCircleIcon,
    RectangleStackIcon,
    MapPinIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    DevicePhoneMobileIcon,
    SparklesIcon,
    SunIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import DropletIcon from '@/Components/Mobile/DropletIcon';
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
import {
    type DevotionalAudience,
    DEVOTIONAL_AUDIENCE_DEFAULT,
    readStoredDevotionalAudience,
} from '@/data/devotionalAudience';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { arrangeHomeCardMosaic, homeCardPhotoPresentation } from '@/data/homeCardPilot';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

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

type QuickAction = {
    id: string;
    label: string;
    subtitle: string;
    route?: string;
    routeParams?: Record<string, string | number>;
    featureKey?: string;
    featureAny?: readonly string[];
    leaderOnly?: boolean;
    onClick?: () => void;
    icon: MenuIcon;
};

/** Atalhos da Home: itens exclusivos + todos do antigo menu Mais (sem duplicar por rota). */
const homeQuickActions: QuickAction[] = [
    {
        id: 'enquetes',
        label: 'Enquetes',
        subtitle: 'Responda e veja o resultado da congregação',
        route: 'mobile.polls.index',
        featureKey: 'polls',
        icon: ChartBarIcon,
    },
    {
        id: 'ano-biblico',
        label: 'Ano Bíblico',
        subtitle: 'Escolha um plano de leitura e acompanhe o seu progresso.',
        route: 'mobile.ano-biblico',
        featureKey: 'ano_biblico',
        icon: BookmarkSquareIcon,
    },
    {
        id: 'batismo',
        label: 'Batismo',
        subtitle: 'Ainda não é batizado? Faça parte da família NS',
        route: 'mobile.baptism',
        featureKey: 'baptism',
        icon: DropletIcon,
    },
    {
        id: 'conheca',
        label: 'Conheça a Nova Semente',
        subtitle: 'Quem somos, pastores e horários',
        route: 'mobile.conheca',
        featureAny: ['quem_somos', 'pastors', 'location', 'services', 'beliefs', 'acompanhar_culto'],
        icon: MapPinIcon,
    },
    {
        id: 'biblioteca',
        label: 'Biblioteca',
        subtitle: 'Livros e PDFs para leitura e download',
        route: 'mobile.biblioteca',
        featureKey: 'library',
        icon: RectangleStackIcon,
    },
    {
        id: 'caixa-promessas',
        label: 'Caixa de Promessas',
        subtitle: 'Uma mensagem especial para você',
        featureKey: 'promise_box',
        icon: SparklesIcon,
    },
    {
        id: 'central-servicos',
        label: 'Central de Serviços',
        subtitle: 'Ofereça e encontre serviços na comunidade.',
        route: 'mobile.talents.index',
        featureKey: 'talents',
        icon: UserGroupIcon,
    },
    {
        id: 'classe-comecos',
        label: 'Classe Começos',
        subtitle: 'Estudo bíblico presencial ou on-line',
        route: 'varios.classe-comecos',
        featureKey: 'classe_comecos',
        icon: AcademicCapIcon,
    },
    {
        id: 'comunidades',
        label: 'Comunidades',
        subtitle: 'Grupos de interesse da igreja no WhatsApp',
        route: 'mobile.communities',
        featureKey: 'communities',
        icon: ChatBubbleOvalLeftEllipsisIcon,
    },
    {
        id: 'conviva',
        label: 'Conviva',
        subtitle: 'Check-in da classe no culto de sábado',
        route: 'mobile.conviva.checkin',
        featureKey: 'conviva',
        icon: AcademicCapIcon,
    },
    {
        id: 'culto',
        label: 'Culto',
        subtitle: 'Vídeos do culto online',
        route: 'mobile.culto',
        featureKey: 'culto',
        icon: FilmIcon,
    },
    {
        id: 'meditacao-diaria',
        label: 'Meditação diária',
        subtitle: 'Adulto, Mulher e Jovem',
        route: 'mobile.meditacao-diaria',
        featureKey: 'devotional',
        icon: SunIcon,
    },
    {
        id: 'licao',
        label: 'Lição',
        subtitle: 'Estudo da lição da escola sabatina',
        route: 'mobile.biblioteca',
        routeParams: { tab: 'lesson', solo: '1' },
        featureKey: 'library',
        icon: ClipboardDocumentListIcon,
    },
    {
        id: 'doacao',
        label: 'Doação',
        subtitle: 'Seu gesto de amor pode transformar vidas e renovar esperanças',
        route: 'mobile.donations.index',
        featureKey: 'charity_donations',
        icon: BanknotesIcon,
    },
    {
        id: 'doar-talentos',
        label: 'Doar Talentos',
        subtitle: 'Compartilhe talentos, aprendizado e apoio gratuito na comunidade',
        route: 'mobile.shared-talents.index',
        featureKey: 'shared_talents',
        icon: GiftIcon,
    },
    {
        id: 'eventos',
        label: 'Eventos',
        subtitle: 'Agenda de eventos da igreja',
        route: 'mobile.events',
        featureKey: 'events',
        icon: CalendarDaysIcon,
    },
    {
        id: 'fotos',
        label: 'Fotos',
        subtitle: 'Veja o que nossos fotógrafos prepararam para você',
        route: 'mobile.fotos',
        featureKey: 'photos',
        icon: CameraIcon,
    },
    {
        id: 'missao',
        label: 'Missão',
        subtitle: 'Eventos, depoimentos, mural e cadastro missionário',
        route: 'mobile.mission',
        featureKey: 'mission',
        icon: GlobeAltIcon,
    },
    {
        id: 'musica',
        label: 'Música',
        subtitle: 'Cante nossas músicas',
        route: 'mobile.musica',
        featureKey: 'musica',
        icon: MusicalNoteIcon,
    },
    {
        id: 'ns-whats',
        label: 'NS Conecta',
        subtitle: 'Converse com departamentos, líderes e voluntários',
        route: 'mobile.ns-whats.index',
        featureKey: 'ns_whats',
        icon: ChatBubbleLeftRightIcon,
    },
    {
        id: 'revista-adventista',
        label: 'Revista Adventista',
        subtitle: 'Artigos, editoriais e colunas da Revista Adventista',
        route: 'mobile.revista-adventista',
        featureKey: 'revista_adventista',
        icon: NewspaperIcon,
    },
    {
        id: 'saude',
        label: 'Saúde',
        subtitle: 'Conteúdos de saúde e bem-estar',
        route: 'mobile.health',
        featureKey: 'health',
        icon: HeartIcon,
    },
    {
        id: 'series',
        label: 'Séries',
        subtitle: 'Conheça todas as nossas séries',
        route: 'mobile.acervo',
        featureKey: 'acervo',
        icon: PlayCircleIcon,
    },
    {
        id: 'voluntario',
        label: 'Voluntário',
        subtitle: 'Faça seu cadastro',
        route: 'volunteers.public-signup.page',
        featureKey: 'volunteer_signup',
        icon: UserPlusIcon,
    },
];

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
            .filter((action) => {
                if (action.featureAny && action.featureAny.length > 0) {
                    return action.featureAny.some((key) => isEnabled(key));
                }

                return !action.featureKey || isEnabled(action.featureKey);
            })
            .filter((action) => !action.leaderOnly || isMinistryLeader)
            .map((action) => ({ kind: 'action' as const, id: action.id, label: action.label, action }));

        return arrangeHomeCardMosaic(actions);
    }, [isEnabled, isMinistryLeader]);

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
            <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-6 sm:max-w-xl md:max-w-3xl lg:max-w-5xl">
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

                <div className={`flex flex-col gap-3 ${showPostRegistrationBanner ? '' : '-mt-3'}`}>
                <header className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="truncate text-xl font-semibold leading-snug tracking-tight text-zinc-900 dark:text-white">
                            {user ? <>Bem-vindo, {displayName}!</> : <>Bem-vindo!</>}
                        </p>
                    </div>
                </header>

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
                <section aria-label="Atalhos" className="relative z-[1]">
                    <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-stretch gap-4">
                        {gridItems.map((item) => {
                            const { id, label, subtitle, route: routeName, routeParams, onClick, icon } = item.action;
                            const pendingBadge =
                                id === 'ns-whats' && nsWhatsPendingReply > 0 ? nsWhatsPendingReply : null;
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
                                    pendingCount={pendingBadge}
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

                <Link
                    href={route('mobile.sobre-o-app')}
                    className="mx-auto flex min-h-11 w-full max-w-lg cursor-pointer items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2 text-left shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-zinc-800/70"
                >
                    <DevicePhoneMobileIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Sobre o APP
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden strokeWidth={1.75} />
                </Link>

                <PromiseBoxModal show={promiseOpen} onClose={() => setPromiseOpen(false)} canFavorite={!!user} />
            </div>
            {user && pendingAppNovelty ? <AppNoveltyOverlay novelty={pendingAppNovelty} /> : null}
        </MobileLayout>
    );
}
