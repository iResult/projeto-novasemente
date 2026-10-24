import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type AreaItem = {
    id: string;
    label: string;
    description: string;
    icon: MenuIcon;
    featureKey?: string;
    href: string;
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
];

export default function HomeVolunteerArea() {
    const { isEnabled } = useAppFeatures();
    const items = ITEMS.filter((item) => !item.featureKey || isEnabled(item.featureKey));

    if (items.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-voluntariado-title" className="@container">
            <div className="mb-3 flex items-center gap-2.5">
                <UserGroupIcon className="h-5 w-5 shrink-0 text-brand-800 dark:text-brand-200" aria-hidden strokeWidth={1.75} />
                <div className="min-w-0">
                    <h2
                        id="home-voluntariado-title"
                        className="text-sm font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50"
                    >
                        Voluntariado
                    </h2>
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                        Sirva, desenvolva seus dons e faça a diferença.
                    </p>
                </div>
            </div>
            <ul className="grid grid-cols-1 items-stretch gap-3.5 @min-[20rem]:grid-cols-2 sm:gap-4">
                {items.map((item) => (
                    <li key={item.id} className="min-w-0">
                        <HomeFeatureCard
                            mediaId={item.id}
                            title={item.label}
                            subtitle={item.description}
                            icon={item.icon}
                            href={route(item.href)}
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
