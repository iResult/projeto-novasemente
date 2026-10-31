import MobileLayout from '@/Layouts/MobileLayout';
import HomeCardBookmarkButton from '@/Components/Mobile/HomeCardBookmarkButton';
import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import DropletIcon from '@/Components/Mobile/DropletIcon';
import PromiseBoxModal from '@/Components/Mobile/PromiseBoxModal';
import PrayingHandsIcon from '@/Components/PrayingHandsIcon';
import {
    HOME_CARD_PILOT_PAGE_KEY,
    HOME_CARD_PILOT_PAGE_SIZE,
    arrangeHomeCardMosaic,
    homeCardPhotoPresentation,
} from '@/data/homeCardPilot';
import {
    DEVOTIONAL_AUDIENCE_DEFAULT,
    readStoredDevotionalAudience,
    type DevotionalAudience,
} from '@/data/devotionalAudience';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { Head, usePage } from '@inertiajs/react';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BookmarkSquareIcon,
    CalendarDaysIcon,
    CameraIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    ClipboardDocumentListIcon,
    FilmIcon,
    GiftIcon,
    GlobeAltIcon,
    HeartIcon,
    MusicalNoteIcon,
    NewspaperIcon,
    PlayCircleIcon,
    RectangleStackIcon,
    SparklesIcon,
    SunIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type QuickAction = {
    id: string;
    label: string;
    subtitle: string;
    route?: string;
    routeParams?: Record<string, string | number>;
    featureKey?: string;
    onClick?: () => void;
    icon: MenuIcon;
};

/** Mesmo catálogo da Home, para o protótipo não inventar nem omitir atalhos. */
const catalog: QuickAction[] = [
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
        id: 'oracao',
        label: 'Oração',
        subtitle: 'Pedidos de oração',
        route: 'mobile.prayer',
        featureKey: 'prayer',
        icon: PrayingHandsIcon,
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
];

const pagerButtonClass =
    'inline-flex h-11 min-w-[7.25rem] cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800';

export default function HomeCardsPilot() {
    const pageProps = usePage();
    const user = (pageProps.props as { auth?: { user?: { id?: number } | null } }).auth?.user ?? null;
    const { isEnabled } = useAppFeatures();
    const [promiseOpen, setPromiseOpen] = useState(false);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [meditationAudience, setMeditationAudience] = useState<DevotionalAudience>(DEVOTIONAL_AUDIENCE_DEFAULT);

    useEffect(() => {
        setMeditationAudience(readStoredDevotionalAudience());
        const stored = Number(sessionStorage.getItem(HOME_CARD_PILOT_PAGE_KEY) ?? '0');
        if (Number.isFinite(stored) && stored >= 0) {
            setPage(Math.floor(stored));
        }
    }, []);

    const items = useMemo(() => {
        const enabled = catalog
            .map((action) =>
                action.id === 'caixa-promessas' ? { ...action, onClick: () => setPromiseOpen(true) } : action,
            )
            .filter((action) => !action.featureKey || isEnabled(action.featureKey));

        return arrangeHomeCardMosaic(enabled);
    }, [isEnabled]);

    const pageCount = Math.max(1, Math.ceil(items.length / HOME_CARD_PILOT_PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    const visible = items.slice(
        safePage * HOME_CARD_PILOT_PAGE_SIZE,
        safePage * HOME_CARD_PILOT_PAGE_SIZE + HOME_CARD_PILOT_PAGE_SIZE,
    );

    const goToPage = (next: number) => {
        const bounded = Math.min(Math.max(0, next), pageCount - 1);
        setPage(bounded);
        sessionStorage.setItem(HOME_CARD_PILOT_PAGE_KEY, String(bounded));
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
    };

    return (
        <MobileLayout>
            <Head title="Protótipo dos cards" />
            <div className="mx-auto flex w-full max-w-[24.5rem] flex-col gap-4 pb-2">
                <header>
                    <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                        Cards da Home
                    </h1>
                    <p className="mt-0.5 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
                        Mesma grade da Home, seis cards por página.
                    </p>
                </header>

                <section aria-label="Atalhos">
                    <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-stretch gap-4">
                        {visible.map((action) => {
                            const presentation = homeCardPhotoPresentation[action.id];
                            const href = action.onClick
                                ? undefined
                                : action.id === 'meditacao-diaria'
                                  ? route(action.route!, { audience: meditationAudience })
                                  : action.routeParams
                                    ? route(action.route!, action.routeParams)
                                    : route(action.route!);

                            return (
                                <HomeFeatureCard
                                    key={action.id}
                                    mediaId={action.id}
                                    title={action.label}
                                    subtitle={action.subtitle}
                                    icon={action.icon}
                                    href={href}
                                    onClick={action.onClick}
                                    framed
                                    layout={presentation ? 'photo' : 'plain'}
                                    presentation={presentation}
                                    bookmark={
                                        <HomeCardBookmarkButton
                                            cardKey={action.id}
                                            bookmarked={bookmarks.includes(action.id)}
                                            tone={presentation ? 'on-dark' : 'surface'}
                                            onToggle={(key) =>
                                                setBookmarks((current) =>
                                                    current.includes(key)
                                                        ? current.filter((item) => item !== key)
                                                        : [...current, key],
                                                )
                                            }
                                        />
                                    }
                                />
                            );
                        })}
                    </div>
                </section>

                <nav aria-label="Páginas dos atalhos" className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        className={pagerButtonClass}
                        disabled={safePage === 0}
                        onClick={() => goToPage(safePage - 1)}
                    >
                        Anterior
                    </button>
                    <p className="text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-300" aria-live="polite">
                        Página {safePage + 1} de {pageCount}
                    </p>
                    <button
                        type="button"
                        className={pagerButtonClass}
                        disabled={safePage >= pageCount - 1}
                        onClick={() => goToPage(safePage + 1)}
                    >
                        Próxima
                    </button>
                </nav>
            </div>

            <PromiseBoxModal show={promiseOpen} onClose={() => setPromiseOpen(false)} canFavorite={!!user} />
        </MobileLayout>
    );
}
