import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import DropletIcon from '@/Components/Mobile/DropletIcon';
import MobileLayout from '@/Layouts/MobileLayout';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpenIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, HandRaisedIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type HubItem = {
    id: string;
    label: string;
    subtitle: string;
    guestSubtitle?: string;
    href: string;
    icon: MenuIcon;
    featureKey?: string;
    pendingCount?: number | null;
};

export default function FaleComNovaSemente({ nsWhatsPendingReply = 0 }: { nsWhatsPendingReply?: number }) {
    const { isEnabled } = useAppFeatures();
    const loggedIn = Boolean((usePage().props as { auth?: { user?: unknown } }).auth?.user);
    const pending = nsWhatsPendingReply > 0 ? nsWhatsPendingReply : null;

    const items: HubItem[] = [
        {
            id: 'batismo',
            label: 'Pedido de Batismo',
            subtitle: 'Ainda não é batizado? Faça parte da família NS',
            href: route('mobile.baptism'),
            icon: DropletIcon,
            featureKey: 'baptism',
        },
        {
            id: 'apresentacao-bebe',
            label: 'Apresentação de bebê',
            subtitle: 'Apresentar uma criança à igreja',
            href: loggedIn
                ? route('mobile.solicitations.hub', { novo: 1, tipo: 'baby_presentation' })
                : route('mobile.fale.baby'),
            icon: HandRaisedIcon,
        },
        {
            id: 'agenda-pastor',
            label: 'Agenda com o Pastor',
            subtitle: 'Marcar conversa presencial ou online',
            href: loggedIn
                ? route('mobile.solicitations.hub', { novo: 1, tipo: 'pastoral' })
                : route('mobile.fale.pastor'),
            icon: CalendarDaysIcon,
        },
        {
            id: 'estudo-biblico',
            label: 'Pedido de Estudo Bíblico',
            subtitle: 'Quero estudar a Bíblia com alguém',
            href: loggedIn
                ? route('mobile.solicitations.hub', { novo: 1, tipo: 'bible_study' })
                : route('mobile.fale.bible'),
            icon: BookOpenIcon,
        },
        {
            id: 'voluntario',
            label: 'Quero ser um voluntário',
            subtitle: 'Faça seu cadastro',
            href: route('volunteers.public-signup.page'),
            icon: UserPlusIcon,
            featureKey: 'volunteer_signup',
        },
        {
            id: 'ns-whats',
            label: 'NS Conecta',
            subtitle: 'Converse com departamentos, líderes e voluntários',
            guestSubtitle: 'Entre na sua conta para conversar',
            href: route('mobile.ns-whats.index'),
            icon: ChatBubbleLeftRightIcon,
            featureKey: 'ns_whats',
            pendingCount: pending,
        },
    ];

    const visible = items.filter((item) => !item.featureKey || isEnabled(item.featureKey));

    return (
        <MobileLayout>
            <Head title="Fale com a Nova Semente" />
            <div className="mx-auto w-full max-w-lg space-y-6 pb-4 sm:max-w-xl md:max-w-3xl">
                <div>
                    <Link
                        href={route('mobile.home')}
                        className="cursor-pointer text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                    >
                        ← Início
                    </Link>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                        Fale com a Nova Semente
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Pedidos à igreja. Só o NS Conecta pede que você entre na conta.
                    </p>
                </div>

                {visible.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Nenhum pedido disponível no momento.
                    </p>
                ) : (
                    <section aria-label="Fale com a Nova Semente">
                        <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-4">
                            {visible.map((item) => (
                                <HomeFeatureCard
                                    key={item.id}
                                    mediaId={item.id}
                                    title={item.label}
                                    subtitle={!loggedIn && item.guestSubtitle ? item.guestSubtitle : item.subtitle}
                                    icon={item.icon}
                                    href={item.href}
                                    pendingCount={item.pendingCount}
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
