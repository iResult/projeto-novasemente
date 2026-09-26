import { Link } from '@inertiajs/react';
import { ClipboardDocumentCheckIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { BEHAVIORAL_TEST_URL } from '@/constants/externalLinks';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type AreaItem = {
    id: string;
    label: string;
    description: string;
    icon: MenuIcon;
    featureKey?: string;
    href: string;
    external?: boolean;
};

const ITEMS: AreaItem[] = [
    {
        id: 'voluntario',
        label: 'Cadastro de Voluntário',
        description: 'Acesse suas atividades, materiais e informações',
        icon: UserPlusIcon,
        featureKey: 'volunteer_signup',
        href: 'volunteers.public-signup.page',
    },
    {
        id: 'teste-comportamental',
        label: 'Teste Comportamental',
        description: 'Conheça mais sobre o seu perfil',
        icon: ClipboardDocumentCheckIcon,
        href: BEHAVIORAL_TEST_URL,
        external: true,
    },
];

const cardClass =
    'group flex h-full min-w-0 cursor-pointer flex-col rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-amber-200/90 transition duration-200 hover:bg-amber-50/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/40 active:bg-amber-50 dark:bg-zinc-900 dark:ring-amber-800/50 dark:hover:bg-amber-950/30 dark:focus-visible:ring-amber-300/40 dark:active:bg-zinc-800';

function AreaCard({ item }: { item: AreaItem }) {
    const Icon = item.icon;
    const content = (
        <>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/80 dark:bg-amber-950/55 dark:text-amber-200 dark:ring-amber-800/70">
                <Icon className="h-5 w-5" aria-hidden strokeWidth={2.05} />
            </span>
            <span className="mt-3 min-w-0">
                <span className="block text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">
                    {item.label}
                </span>
                <span className="mt-1 block text-[11px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">
                    {item.description}
                </span>
            </span>
        </>
    );

    if (item.external) {
        return (
            <li className="min-w-0">
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
                    {content}
                </a>
            </li>
        );
    }

    return (
        <li className="min-w-0">
            <Link href={route(item.href)} className={cardClass}>
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
        <section
            aria-labelledby="home-voluntariado-title"
            className="@container rounded-3xl bg-amber-50/90 px-3.5 py-4 ring-1 ring-amber-200/80 dark:bg-amber-950/30 dark:ring-amber-800/45"
        >
            <div className="mb-3 flex items-center gap-2.5">
                <UserGroupIcon
                    className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
                    aria-hidden
                    strokeWidth={1.75}
                />
                <div className="min-w-0">
                    <h2
                        id="home-voluntariado-title"
                        className="text-sm font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white"
                    >
                        Voluntariado
                    </h2>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">
                        Sirva, desenvolva seus dons e faça a diferença.
                    </p>
                </div>
            </div>
            <ul className="grid grid-cols-1 gap-4 @min-[20rem]:grid-cols-2 sm:gap-5">
                {items.map((item) => (
                    <AreaCard key={item.id} item={item} />
                ))}
            </ul>
        </section>
    );
}
