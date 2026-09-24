import { Link } from '@inertiajs/react';
import { ClipboardDocumentCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const BEHAVIORAL_TEST_URL = 'https://certero.com.br/form.html?avaliacao=MTY=';

type AreaItem = {
    id: string;
    label: string;
    icon: MenuIcon;
    featureKey?: string;
    href: string;
    external?: boolean;
};

const ITEMS: AreaItem[] = [
    {
        id: 'voluntario',
        label: 'Voluntário',
        icon: UserPlusIcon,
        featureKey: 'volunteer_signup',
        href: 'volunteers.public-signup.page',
    },
    {
        id: 'teste-comportamental',
        label: 'Teste Comportamental',
        icon: ClipboardDocumentCheckIcon,
        href: BEHAVIORAL_TEST_URL,
        external: true,
    },
];

function AreaIcon({ item }: { item: AreaItem }) {
    const Icon = item.icon;
    const className =
        'group flex min-w-0 cursor-pointer flex-col items-center gap-2 px-1 py-1 text-center';
    const content = (
        <>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200">
                <Icon className="h-6 w-6" aria-hidden strokeWidth={1.7} />
            </span>
            <span className="max-w-full text-[12px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                {item.label}
            </span>
        </>
    );

    if (item.external) {
        return (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link href={route(item.href)} className={className}>
            {content}
        </Link>
    );
}

export default function HomeVolunteerArea() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => !item.featureKey || isEnabled(item.featureKey));

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Área dos Voluntários"
            className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700"
        >
            <h2 className="text-center text-[15px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
                Área dos Voluntários
            </h2>
            <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
                {items.map((item) => (
                    <AreaIcon key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
}
