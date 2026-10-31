import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpenIcon,
    HandRaisedIcon,
    MagnifyingGlassIcon,
    NewspaperIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ComponentType, KeyboardEvent, SVGProps } from 'react';
import PrayingHandsIcon from '@/Components/PrayingHandsIcon';
import PromiseBoxModal from '@/Components/Mobile/PromiseBoxModal';
import {
    DEVOTIONAL_AUDIENCE_DEFAULT,
    readStoredDevotionalAudience,
    type DevotionalAudience,
} from '@/data/devotionalAudience';
import { homeQuickActions, type HomeQuickAction } from '@/data/homeQuickActions';
import {
    homeBarSearchDestinations,
    isHomeSearchDestinationVisible,
    rankHomeShortcuts,
} from '@/data/homeShortcutSearch';
import { useAppFeatures } from '@/hooks/useAppFeatures';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type SearchRow = {
    id: string;
    label: string;
    subtitle: string;
    icon: MenuIcon;
    href?: string;
    onClick?: () => void;
};

const barIcons: Record<string, MenuIcon> = {
    oracao: HandRaisedIcon,
    publicacoes: NewspaperIcon,
    oferta: PrayingHandsIcon,
    biblia: BookOpenIcon,
};

type Props = {
    actions?: readonly HomeQuickAction[];
    meditationAudience?: DevotionalAudience;
    isMinistryLeader?: boolean;
    onOpenPromise?: () => void;
};

function hrefFor(action: HomeQuickAction, audience: DevotionalAudience): string | undefined {
    if (!action.route) {
        return undefined;
    }

    if (action.id === 'meditacao-diaria') {
        return route(action.route, { audience });
    }

    if (action.routeParams) {
        return route(action.route, action.routeParams);
    }

    return route(action.route);
}

export default function HomeShortcutSearch({
    actions = homeQuickActions,
    meditationAudience,
    isMinistryLeader,
    onOpenPromise,
}: Props) {
    const { isEnabled } = useAppFeatures();
    const page = usePage();
    const auth = page.props.auth as { user?: { name?: string } | null; isMinistryLeaderAccount?: boolean } | undefined;
    const leader = isMinistryLeader ?? auth?.isMinistryLeaderAccount === true;
    const [ownPromiseOpen, setOwnPromiseOpen] = useState(false);
    const [storedAudience, setStoredAudience] = useState<DevotionalAudience>(() =>
        typeof window !== 'undefined' ? readStoredDevotionalAudience() : DEVOTIONAL_AUDIENCE_DEFAULT,
    );
    const audience = meditationAudience ?? storedAudience;
    const openPromise = onOpenPromise ?? (() => setOwnPromiseOpen(true));

    useEffect(() => {
        if (meditationAudience) {
            return;
        }
        const sync = () => setStoredAudience(readStoredDevotionalAudience());
        window.addEventListener('focus', sync);
        document.addEventListener('visibilitychange', sync);
        return () => {
            window.removeEventListener('focus', sync);
            document.removeEventListener('visibilitychange', sync);
        };
    }, [meditationAudience]);
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [dismissed, setDismissed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const catalog = useMemo(() => {
        const fromHome: SearchRow[] = actions
            .filter((action) => isHomeSearchDestinationVisible(action, isEnabled, leader))
            .map((action) => {
                const opensPromise = action.id === 'caixa-promessas';

                return {
                    id: action.id,
                    label: action.label,
                    subtitle: action.subtitle,
                    icon: action.icon,
                    href: opensPromise ? undefined : hrefFor(action, audience),
                    onClick: opensPromise ? openPromise : undefined,
                };
            });

        const fromBar: SearchRow[] = homeBarSearchDestinations
            .filter((item) => isHomeSearchDestinationVisible(item, isEnabled, leader))
            .map((item) => ({
                id: item.id,
                label: item.label,
                subtitle: item.subtitle,
                icon: barIcons[item.id] ?? BookOpenIcon,
                href: route(item.route),
            }));

        return [...fromHome, ...fromBar];
    }, [actions, audience, isEnabled, leader, openPromise]);

    const trimmed = query.trim();
    const results = useMemo(
        () => (trimmed === '' ? [] : rankHomeShortcuts(catalog, trimmed)),
        [catalog, trimmed],
    );
    const open = trimmed !== '' && !dismissed;
    const active = results[activeIndex] ?? null;

    useEffect(() => {
        setActiveIndex(0);
    }, [trimmed]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setDismissed(true);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    const closeAndClear = () => {
        setQuery('');
        setDismissed(true);
    };

    const activate = (row: SearchRow) => {
        closeAndClear();
        if (row.onClick) {
            row.onClick();
            return;
        }
        if (row.href) {
            router.visit(row.href);
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeAndClear();
            return;
        }

        if (!open || results.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === 'Enter' && active) {
            event.preventDefault();
            activate(active);
        }
    };

    const rowClass = (selected: boolean) =>
        `flex min-h-11 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition ${
            selected
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70'
        }`;

    return (
        <div ref={rootRef} className="relative z-20 w-full max-w-lg">
            <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
                aria-hidden
            />
            <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-label="Buscar"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open && active ? `${listId}-${active.id}` : undefined}
                value={query}
                placeholder="Buscar"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                onChange={(event) => {
                    setQuery(event.target.value);
                    setDismissed(false);
                }}
                onFocus={() => setDismissed(false)}
                onKeyDown={onKeyDown}
                className={`h-10 w-full rounded-full border-0 bg-white pl-9 text-sm text-zinc-800 shadow-none ring-1 ring-zinc-200/90 placeholder:text-zinc-500 caret-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-400 dark:caret-zinc-200 dark:focus:ring-zinc-600 ${
                    query !== '' ? 'pr-9' : 'pr-4'
                }`}
            />
            {query !== '' ? (
                <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                        closeAndClear();
                        inputRef.current?.focus();
                    }}
                    className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                    <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
            ) : null}

            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-10 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
                    {results.length === 0 ? (
                        <p className="px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400" role="status">
                            Nada encontrado
                        </p>
                    ) : (
                        <ul id={listId} role="listbox" aria-label="Resultados da busca" className="py-1">
                            {results.map((row, index) => {
                                const selected = index === activeIndex;
                                const Icon = row.icon;
                                const body = (
                                    <>
                                        <Icon
                                            className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                                            aria-hidden
                                            strokeWidth={1.75}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {row.label}
                                            </span>
                                            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                                                {row.subtitle}
                                            </span>
                                        </span>
                                    </>
                                );

                                if (row.href) {
                                    return (
                                        <li key={row.id} role="presentation">
                                            <Link
                                                id={`${listId}-${row.id}`}
                                                role="option"
                                                aria-selected={selected}
                                                href={row.href}
                                                className={rowClass(selected)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    activate(row);
                                                }}
                                            >
                                                {body}
                                            </Link>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={row.id} role="presentation">
                                        <button
                                            id={`${listId}-${row.id}`}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            className={rowClass(selected)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => activate(row)}
                                        >
                                            {body}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            ) : null}
            {onOpenPromise ? null : (
                <PromiseBoxModal
                    show={ownPromiseOpen}
                    onClose={() => setOwnPromiseOpen(false)}
                    canFavorite={Boolean(auth?.user)}
                />
            )}
        </div>
    );
}
