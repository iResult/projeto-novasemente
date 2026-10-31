import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import MobileLayout from '@/Layouts/MobileLayout';
import { Head } from '@inertiajs/react';
import { ClockIcon, EyeIcon, HeartIcon, MapPinIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import BackLink from '@/Components/BackLink';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type HubItem = {
    label: string;
    subtitle: string;
    route: string;
    featureKey: string;
    icon: MenuIcon;
};

const ITEMS: HubItem[] = [
    {
        label: 'Quem somos',
        subtitle: 'Nossa história, missão e propósito como igreja.',
        route: 'mobile.quem-somos',
        featureKey: 'quem_somos',
        icon: UserGroupIcon,
    },
    {
        label: 'Pastores',
        subtitle: 'Conheça nossos pastores e sua equipe pastoral.',
        route: 'mobile.pastors',
        featureKey: 'pastors',
        icon: UserCircleIcon,
    },
    {
        label: 'Localização',
        subtitle: 'Endereço, mapa e como chegar até a igreja.',
        route: 'mobile.location',
        featureKey: 'location',
        icon: MapPinIcon,
    },
    {
        label: 'Horários',
        subtitle: 'Confira nossos cultos e reuniões semanais.',
        route: 'mobile.services',
        featureKey: 'services',
        icon: ClockIcon,
    },
    {
        label: 'Acompanhar Programação',
        subtitle: 'Etapas da programação, no horário.',
        route: 'mobile.acompanhar-culto',
        featureKey: 'acompanhar_culto',
        icon: EyeIcon,
    },
    {
        label: 'Em que cremos',
        subtitle: 'Nossas crenças e valores fundamentados na Palavra.',
        route: 'mobile.beliefs',
        featureKey: 'beliefs',
        icon: HeartIcon,
    },
];

export default function ConhecaNovaSemente() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => isEnabled(item.featureKey));

    return (
        <MobileLayout>
            <Head title="Conheça a Nova Semente" />
            <div className="mx-auto w-full max-w-lg space-y-6 pb-4 sm:max-w-xl md:max-w-2xl">
                <div>
                    <BackLink href={route('mobile.home')} ariaLabel="Voltar para o início" />
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                        Conheça a Nova Semente
                    </h1>
                </div>

                {items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Nenhum conteúdo disponível no momento.
                    </p>
                ) : (
                    <section aria-label="Sobre a igreja">
                        <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-stretch gap-4">
                            {items.map(({ label, subtitle, route: routeName, icon }) => (
                                <HomeFeatureCard
                                    key={routeName}
                                    mediaId={routeName}
                                    title={label}
                                    subtitle={subtitle}
                                    icon={icon}
                                    href={route(routeName)}
                                    layout="plain"
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </MobileLayout>
    );
}
