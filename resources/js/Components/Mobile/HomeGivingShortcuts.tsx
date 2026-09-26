import { Link } from '@inertiajs/react';
import { BanknotesIcon, ClipboardDocumentCheckIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { BEHAVIORAL_TEST_URL } from '@/constants/externalLinks';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type ShortcutItem = {
    id: string;
    label: string;
    icon: MenuIcon;
    badge?: string;
    route?: string;
    featureKey?: string;
    externalHref?: string;
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
    {
        id: 'teste-comportamental',
        label: 'Teste Comportamental',
        externalHref: BEHAVIORAL_TEST_URL,
        icon: ClipboardDocumentCheckIcon,
        badge: 'NOVO',
    },
];

const shortcutClass =
    'group flex min-w-0 cursor-pointer flex-col items-center gap-2 px-1 py-2 text-center';

export default function HomeGivingShortcuts() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => !item.featureKey || isEnabled(item.featureKey));

    if (items.length === 0) {
        return null;
    }

    return (
        <section aria-label="Atalhos rápidos" className="py-1">
            <div className="grid w-full grid-cols-3 items-start px-3">
                {items.map((item) => {
                    const Icon = item.icon;
                    const content = (
                        <>
                            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200">
                                <Icon className="h-6 w-6" aria-hidden strokeWidth={1.7} />
                                {item.badge ? (
                                    <span className="absolute -right-2 -top-1.5 inline-flex items-center rounded-full bg-emerald-800 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white dark:bg-emerald-400 dark:text-emerald-950">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span className="max-w-full text-balance text-[12px] font-medium leading-tight text-zinc-800 dark:text-zinc-100">
                                {item.label}
                            </span>
                        </>
                    );

                    if (item.externalHref) {
                        return (
                            <a
                                key={item.id}
                                href={item.externalHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={shortcutClass}
                            >
                                {content}
                            </a>
                        );
                    }

                    return (
                        <Link key={item.id} href={route(item.route!)} className={shortcutClass}>
                            {content}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
