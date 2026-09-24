import { Link } from '@inertiajs/react';
import { BanknotesIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type ShortcutItem = {
    id: string;
    label: string;
    route: string;
    featureKey: string;
    icon: MenuIcon;
};

const ITEMS: ShortcutItem[] = [
    {
        id: 'oferta-nova-semente',
        label: 'Oferta NS',
        route: 'mobile.campaigns.index',
        featureKey: 'donation_campaigns',
        icon: BanknotesIcon,
    },
    {
        id: 'dizimos-pacto',
        label: 'Dízimo e Pacto',
        route: 'mobile.offerings',
        featureKey: 'offerings',
        icon: HandRaisedIcon,
    },
];

export default function HomeGivingShortcuts() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => isEnabled(item.featureKey));

    if (items.length === 0) {
        return null;
    }

    return (
        <section aria-label="Atalhos rápidos" className="py-1">
            <div className="flex w-full items-start gap-8 px-1 sm:gap-10">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={route(item.route)}
                            className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 py-2 text-center"
                        >
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200">
                                <Icon className="h-6 w-6" aria-hidden strokeWidth={1.7} />
                            </span>
                            <span className="text-[12px] font-medium leading-tight text-zinc-800 dark:text-zinc-100">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
