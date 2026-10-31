import AppVersionHistoryModal from '@/Components/AppVersionHistoryModal';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { useAppVersionLabels } from '@/hooks/useAppVersionLabels';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowTopRightOnSquareIcon,
    ChevronRightIcon,
    GlobeAltIcon,
    LifebuoyIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { useState, type ReactNode } from 'react';

const OFFICIAL_LINKS: { title: string; subtitle: string; href: string }[] = [
    {
        title: 'Aplicação web',
        subtitle: 'app.novasemente.com.br',
        href: 'https://app.novasemente.com.br/',
    },
];

const ICON_WRAP =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-teal-700 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:text-teal-300 dark:ring-zinc-700';

const ROW_CLASS =
    'group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700/30 dark:hover:bg-zinc-800/70 dark:active:bg-zinc-800 dark:focus-visible:ring-teal-300/30';

function AppleLogo({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.8.86-2.1 1.52-3.22 1.43-.14-1.1.4-2.25 1.16-3.06.82-.88 2.22-1.53 3.24-1.39zM20.5 17.18c-.58 1.3-.86 1.88-1.61 3.03-1.05 1.6-2.53 3.59-4.36 3.61-1.62.02-2.04-1.06-4.25-1.05-2.2.01-2.66 1.07-4.28 1.05-1.83-.02-3.23-1.82-4.28-3.41C-.1 17.3-.9 12.9.96 9.9c1.17-1.9 3.03-3.1 4.78-3.1 1.78 0 2.9 1.1 4.37 1.1 1.43 0 2.3-1.11 4.37-1.11 1.56 0 3.21.85 4.38 2.31-3.85 2.11-3.23 7.6.64 8.08z" />
        </svg>
    );
}

function PlayStoreLogo({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M3.6 2.3c-.3.2-.5.6-.5 1.1v17.2c0 .5.2.9.5 1.1l9.4-9.7L3.6 2.3z" />
            <path fill="#FBBC04" d="M16.3 15.1 13.1 11.9 3.6 21.7c.2.1.4.2.7.2.3 0 .7-.1 1-.4l11-6.4z" />
            <path fill="#4285F4" d="M20.7 10.7 16.3 8.1 13.1 11.9l3.2 3.2 4.4-2.5c.9-.5.9-1.4 0-1.9z" />
            <path fill="#34A853" d="M13.1 11.9 16.3 8.1 5.3 1.7c-.3-.2-.7-.3-1-.3-.3 0-.5.1-.7.2l9.5 10.3z" />
        </svg>
    );
}

function ItemRow({
    title,
    subtitle,
    icon,
    trailing,
}: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    trailing: ReactNode;
}) {
    return (
        <>
            <span className={ICON_WRAP}>{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-white">{title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-zinc-500 dark:text-zinc-400">{subtitle}</span>
            </span>
            {trailing}
        </>
    );
}

export default function SobreOAppPanel({ className = '' }: { className?: string }) {
    const { webLabel: webVersionLabel, installedLabel } = useAppVersionLabels();
    const { isEnabled } = useAppFeatures();
    const showSupport = isEnabled('support');
    const { iosAppStoreUrl = null, androidPlayStoreUrl = null } = usePage().props as {
        iosAppStoreUrl?: string | null;
        androidPlayStoreUrl?: string | null;
    };
    const appleUrl = (iosAppStoreUrl ?? '').trim();
    const playUrl = (androidPlayStoreUrl ?? '').trim();
    const [versionsOpen, setVersionsOpen] = useState(false);

    return (
        <div className={`mx-auto w-full max-w-md ${className}`.trim()}>
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-800">
                <ul className="divide-y divide-zinc-200/90 dark:divide-zinc-800">
                    <li>
                        <button
                            type="button"
                            onClick={() => setVersionsOpen(true)}
                            aria-label="Abrir histórico de versões e ver o que mudou"
                            className={ROW_CLASS}
                        >
                            <ItemRow
                                title="Versões"
                                subtitle={`Web ${webVersionLabel} · App instalada ${installedLabel}`}
                                icon={<TagIcon className="h-5 w-5" aria-hidden strokeWidth={1.75} />}
                                trailing={
                                    <ChevronRightIcon
                                        className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-teal-700 dark:text-zinc-600 dark:group-hover:text-teal-300"
                                        aria-hidden
                                    />
                                }
                            />
                        </button>
                    </li>

                    {showSupport ? (
                        <li>
                            <Link href={route('mobile.support.index')} className={ROW_CLASS}>
                                <ItemRow
                                    title="Suporte"
                                    subtitle="Problema, sugestão ou elogio sobre o app"
                                    icon={<LifebuoyIcon className="h-5 w-5" aria-hidden strokeWidth={1.75} />}
                                    trailing={
                                        <ChevronRightIcon
                                            className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-teal-700 dark:text-zinc-600 dark:group-hover:text-teal-300"
                                            aria-hidden
                                        />
                                    }
                                />
                            </Link>
                        </li>
                    ) : null}

                    {appleUrl ? (
                        <li>
                            <a
                                href={appleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={ROW_CLASS}
                            >
                                <ItemRow
                                    title="App Store"
                                    subtitle="Baixar para iPhone"
                                    icon={<AppleLogo className="h-5 w-5 text-zinc-900 dark:text-white" />}
                                    trailing={
                                        <ArrowTopRightOnSquareIcon
                                            className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-teal-700 dark:group-hover:text-teal-300"
                                            aria-hidden
                                        />
                                    }
                                />
                            </a>
                        </li>
                    ) : null}

                    {playUrl ? (
                        <li>
                            <a href={playUrl} target="_blank" rel="noopener noreferrer" className={ROW_CLASS}>
                                <ItemRow
                                    title="Google Play"
                                    subtitle="Baixar para Android"
                                    icon={<PlayStoreLogo className="h-5 w-5" />}
                                    trailing={
                                        <ArrowTopRightOnSquareIcon
                                            className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-teal-700 dark:group-hover:text-teal-300"
                                            aria-hidden
                                        />
                                    }
                                />
                            </a>
                        </li>
                    ) : null}

                    {OFFICIAL_LINKS.map((row) => (
                        <li key={row.href}>
                            <a href={row.href} target="_blank" rel="noopener noreferrer" className={ROW_CLASS}>
                                <ItemRow
                                    title={row.title}
                                    subtitle={row.subtitle}
                                    icon={<GlobeAltIcon className="h-5 w-5" aria-hidden strokeWidth={1.75} />}
                                    trailing={
                                        <ArrowTopRightOnSquareIcon
                                            className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-teal-700 dark:group-hover:text-teal-300"
                                            aria-hidden
                                        />
                                    }
                                />
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            <p className="pt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Criado por{' '}
                <a
                    href="https://iresult.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-200"
                >
                    iResult.com.br
                </a>
            </p>

            <AppVersionHistoryModal
                show={versionsOpen}
                onClose={() => setVersionsOpen(false)}
                highlightLabel={webVersionLabel}
            />
        </div>
    );
}
