import { Link } from '@inertiajs/react';
import PrayingHandsIcon from '@/Components/PrayingHandsIcon';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import {
    HomeIcon as HomeOutlineIcon,
    HandRaisedIcon as HandRaisedOutlineIcon,
    BookOpenIcon as BookOpenOutlineIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeSolidIcon,
    HandRaisedIcon as HandRaisedSolidIcon,
    BookOpenIcon as BookOpenSolidIcon,
} from '@heroicons/react/24/solid';
import type { ComponentType, SVGProps } from 'react';

type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type NavItem = {
    name: string;
    route: string;
    activeRoutes: readonly string[];
    icon?: NavIcon;
    iconActive?: NavIcon;
    featureKey?: string;
    /** Visível se qualquer uma destas funcionalidades estiver ligada. */
    featureAny?: readonly string[];
    /** PNG único no lugar de ícone + rótulo (ex.: Publicações). */
    imageSrc?: string;
};

const navItems: NavItem[] = [
    {
        name: 'Home',
        route: 'mobile.home',
        activeRoutes: [
            'mobile.home',
            'mobile.conheca',
            'volunteers.public-signup.page',
            'mobile.baptism',
            'mobile.fale',
            'mobile.fale.baby',
            'mobile.fale.bible',
            'mobile.fale.other',
            'mobile.fale.pastor',
            'mobile.sobre-o-app',
            'mobile.settings',
            'more.index',
            'mobile.beliefs',
            'mobile.quem-somos',
            'varios.services',
            'mobile.services',
            'varios.contact',
            'mobile.ns-whats.index',
            'mobile.ns-whats.compose',
            'mobile.ns-whats.show',
            'mobile.ns-whats.leader.index',
            'mobile.ns-whats.leader.show',
            'mobile.contact',
            'mobile.contact.store',
            'mobile.leader-solicitations.index',
            'mobile.leader-solicitations.show',
            'mobile.leader-solicitations.messages.store',
            'mobile.fotos',
            'mobile.fotos.show',
            'mobile.location',
            'varios.schedule',
            'varios.classe-comecos',
            'mobile.classe-comecos',
            'mobile.acervo',
            'mobile.acervo.show',
            'musica.index',
            'mobile.musica',
            'mobile.musica.show',
            'varios.notifications',
            'mobile.notifications',
            'mobile.inventory',
            'mobile.pastors',
            'mobile.solicitations.hub',
            'mobile.solicitations.mine',
            'mobile.solicitations.create',
            'mobile.solicitations.show',
            'mobile.support.index',
            'mobile.support.ticket',
            'mobile.pastoral-appointments.request',
            'mobile.pastor-availability',
            'pastoral-agenda.index',
            'pastors.weekly-schedule.update',
            'mobile.schedule',
            'escalas.index',
            'mobile.events',
            'mobile.health',
            'mobile.health.show',
            'mobile.revista-adventista',
            'mobile.revista-adventista.show',
            'mobile.acervo-revista-adventista',
            'mobile.acervo-revista-adventista.show',
            'mobile.mission',
            'mobile.mission.home',
            'mobile.mission.events',
            'mobile.mission.messages',
            'mobile.mission.about',
            'mobile.mission.wall',
            'mobile.mission.form',
            'mission.form',
            'mobile.communities',
            'mobile.biblioteca',
            'mobile.biblioteca.show',
            'mobile.ano-biblico',
            'mobile.ano-biblico.complete',
            'mobile.news',
            'mobile.news.show',
            'mobile.meditacao-diaria',
            'mobile.talents.index',
            'mobile.shared-talents.index',
            'mobile.donations.index',
        ],
        icon: HomeOutlineIcon,
        iconActive: HomeSolidIcon,
    },
    {
        name: 'Oração',
        route: 'mobile.prayer',
        featureKey: 'prayer',
        activeRoutes: ['mobile.prayer', 'prayer.index'],
        icon: HandRaisedOutlineIcon,
        iconActive: HandRaisedSolidIcon,
    },
    {
        name: 'Publicações',
        route: 'mobile.publications-feed',
        activeRoutes: ['mobile.publications-feed', 'mobile.index'],
        imageSrc: '/logo-ns.png',
    },
    {
        name: 'Oferta',
        route: 'mobile.oferta',
        featureAny: ['donation_campaigns', 'offerings'],
        activeRoutes: [
            'mobile.oferta',
            'mobile.offerings',
            'mobile.campaigns.index',
            'mobile.campaigns.show',
            'mobile.campaigns.receipt',
            'mobile.campaigns.donate',
            'mobile.campaigns.my-donations',
            'mobile.campaigns.dispute',
        ],
        icon: PrayingHandsIcon,
        iconActive: PrayingHandsIcon,
    },
    {
        name: 'Bíblia',
        route: 'mobile.bible',
        featureKey: 'bible',
        activeRoutes: ['mobile.bible', 'mobile.bible.chapter', 'mobile.bible.search', 'mobile.bible.reference'],
        icon: BookOpenOutlineIcon,
        iconActive: BookOpenSolidIcon,
    },
];

/** Barra inferior: Home, Oração, Publicações, Oferta, Bíblia. */
export default function MobileBottomNav({ borderless = false }: { borderless?: boolean }) {
    const { isEnabled } = useAppFeatures();
    const visibleItems = navItems.filter((item) => {
        if (item.featureAny && item.featureAny.length > 0) {
            return item.featureAny.some((key) => isEnabled(key));
        }

        if (!item.featureKey) {
            return true;
        }

        return isEnabled(item.featureKey);
    });

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 ${
                borderless ? '' : 'border-t border-zinc-200 dark:border-zinc-800'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            aria-label="Menu principal"
        >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around pt-1 md:h-14 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
                {visibleItems.map((item) => {
                    const { name, route: routeName, activeRoutes, icon: Icon, iconActive: IconActive, imageSrc } = item;
                    const href = route(routeName);
                    const isActive = activeRoutes.some((r) => route().current(r));
                    const IconComponent = isActive ? IconActive : Icon;
                    return (
                        <Link
                            key={routeName}
                            href={href}
                            aria-label={name}
                            className="relative mx-0.5 flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-zinc-900 transition-colors active:bg-zinc-100/80 dark:text-zinc-100 dark:active:bg-zinc-800/50"
                        >
                            {imageSrc ? (
                                <span className="relative -mt-5 inline-flex h-14 w-14 items-center justify-center md:-mt-1 md:h-11 md:w-11">
                                    {/* Halo externo — pulso expandindo */}
                                    <span
                                        aria-hidden
                                        className="ns-publications-nav-ping pointer-events-none absolute inset-0 rounded-full bg-brand-400/35 dark:bg-brand-400/25"
                                    />
                                    {/* Anel sólido piscando */}
                                    <span
                                        aria-hidden
                                        className={`ns-publications-nav-ring pointer-events-none absolute rounded-full border-[3px] border-brand-500 dark:border-brand-400 ${
                                            isActive ? 'inset-0' : 'inset-0.5'
                                        }`}
                                    />
                                    <img
                                        src={imageSrc}
                                        alt=""
                                        className={`relative z-[1] rounded-full object-cover shadow-md ring-2 ring-white dark:ring-zinc-900 ${
                                            isActive ? 'h-12 w-12 md:h-9 md:w-9' : 'h-11 w-11 md:h-8 md:w-8'
                                        }`}
                                        aria-hidden
                                    />
                                </span>
                            ) : (
                                <>
                                    {IconComponent ? (
                                        <IconComponent
                                            className={`flex-shrink-0 transition-all ${
                                                isActive
                                                    ? 'h-7 w-7 text-zinc-900 dark:text-zinc-100'
                                                    : 'h-6 w-6 text-zinc-900 dark:text-zinc-100'
                                            }`}
                                            aria-hidden
                                            {...(isActive ? {} : { strokeWidth: 1.75 })}
                                        />
                                    ) : null}
                                    <span
                                        className={`max-w-full truncate px-0.5 text-[10px] ${
                                            isActive
                                                ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                                                : 'font-medium text-zinc-900 dark:text-zinc-100'
                                        }`}
                                    >
                                        {name}
                                    </span>
                                </>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
