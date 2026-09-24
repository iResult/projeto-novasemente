import { Link } from '@inertiajs/react';
import { ChevronRightIcon, ClipboardDocumentCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';
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
        label: 'Área do voluntário',
        icon: UserPlusIcon,
        featureKey: 'volunteer_signup',
        href: 'volunteers.public-signup.page',
    },
    {
        id: 'teste-comportamental',
        label: 'Teste comportamental',
        icon: ClipboardDocumentCheckIcon,
        href: BEHAVIORAL_TEST_URL,
        external: true,
    },
];

const rowClass =
    'group flex w-full cursor-pointer items-center gap-3 px-4 text-left transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700/40 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-emerald-300/40 dark:active:bg-zinc-800';

function AreaRow({ item, divided }: { item: AreaItem; divided: boolean }) {
    const Icon = item.icon;
    const content = (
        <>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-800/60">
                <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
            </span>
            <span
                className={`flex min-h-[4.25rem] min-w-0 flex-1 items-center gap-3 ${
                    divided ? 'border-t border-zinc-200/90 dark:border-zinc-700' : ''
                }`}
            >
                <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">
                    {item.label}
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
            </span>
        </>
    );

    if (item.external) {
        return (
            <li>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={rowClass}>
                    {content}
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link href={route(item.href)} className={rowClass}>
                {content}
            </Link>
        </li>
    );
}

export default function HomeVolunteerArea() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => !item.featureKey || isEnabled(item.featureKey));

    if (items.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-voluntariado-title">
            <h2
                id="home-voluntariado-title"
                className="mb-3 text-sm font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white"
            >
                Voluntariado
            </h2>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
                {items.map((item, index) => (
                    <AreaRow key={item.id} item={item} divided={index > 0} />
                ))}
            </ul>
        </section>
    );
}
