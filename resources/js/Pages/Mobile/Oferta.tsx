import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import MobileLayout from '@/Layouts/MobileLayout';
import { Head } from '@inertiajs/react';
import { BanknotesIcon, HandRaisedIcon } from '@heroicons/react/24/outline';

const cards = [
    {
        id: 'oferta-nova-semente',
        title: 'Oferta NS',
        subtitle: 'Campanhas de oferta da Nova Semente',
        route: 'mobile.campaigns.index',
        featureKey: 'donation_campaigns',
        icon: BanknotesIcon,
    },
    {
        id: 'dizimos-pacto',
        title: 'Dízimo e Pacto',
        subtitle: 'Dízimo, oferta e pacto da igreja',
        route: 'mobile.offerings',
        featureKey: 'offerings',
        icon: HandRaisedIcon,
    },
] as const;

export default function Oferta() {
    const { isEnabled } = useAppFeatures();
    const visible = cards.filter((card) => isEnabled(card.featureKey));

    return (
        <MobileLayout>
            <Head title="Oferta" />
            <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-6 sm:max-w-xl md:max-w-3xl">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Oferta</h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Escolha como deseja contribuir.
                    </p>
                </header>

                {visible.length === 0 ? (
                    <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                        Nenhuma forma de oferta está disponível no momento.
                    </p>
                ) : (
                    <section aria-label="Formas de oferta">
                        <div className="grid grid-cols-2 items-stretch gap-4">
                            {visible.map((card) => (
                                <HomeFeatureCard
                                    key={card.id}
                                    mediaId={card.id}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    icon={card.icon}
                                    href={route(card.route)}
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
