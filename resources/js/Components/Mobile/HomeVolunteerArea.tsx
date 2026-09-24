import { Link } from '@inertiajs/react';
import { ClipboardDocumentCheckIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const BEHAVIORAL_TEST_URL = 'https://certero.com.br/form.html?avaliacao=MTY=';

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
        label: 'Teste comportamental',
        description: 'Conheça mais sobre o seu perfil',
        icon: ClipboardDocumentCheckIcon,
        href: BEHAVIORAL_TEST_URL,
        external: true,
    },
];

const cardClass =
    'group flex h-full min-w-0 cursor-pointer flex-col rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-zinc-200 transition duration-200 hover:bg-zinc-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 active:bg-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-emerald-300/40 dark:active:bg-zinc-800';

function AreaCard({ item }: { item: AreaItem }) {
    const Icon = item.icon;
    const content = (
        <>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-800/60">
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
        <section aria-labelledby="home-voluntariado-title" className="@container">
            <div className="mb-3 flex items-center gap-2.5">
                <UserGroupIcon
                    className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
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
