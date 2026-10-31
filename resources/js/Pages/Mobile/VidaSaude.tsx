import MobileLayout from '@/Layouts/MobileLayout';
import ListSearchHint from '@/Components/ListSearchHint';
import NewsPostCover from '@/Components/News/NewsPostCover';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { MagnifyingGlassIcon, NewspaperIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { isListSearchBelowMinimum, LIST_SEARCH_DEBOUNCE_MS, serverSearchTerm } from '@/utils/listSearch';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    section: string | null;
    section_label: string;
    author_name: string | null;
    image_url: string | null;
    cover_url: string | null;
    published_at: string | null;
}

interface SectionOption {
    value: string;
    label: string;
}

interface Group {
    slug: string;
    label: string;
    articles: Article[];
}

interface Paginator {
    data: Article[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
}

interface Props {
    latest: Article[];
    groups: Group[];
    articles: Paginator | null;
    sections: SectionOption[];
    filters: {
        section: string | null;
        q: string | null;
    };
}

function imageSrc(url: string | null, appUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = appUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}${url}`;
}

function buildQuery(section: string | null, q: string | null): Record<string, string> {
    const params: Record<string, string> = {};
    if (section) params.section = section;
    if (q) params.q = q;
    return params;
}

function ArticleCard({
    article,
    appUrl,
    featured = false,
}: {
    article: Article;
    appUrl: string;
    featured?: boolean;
}) {
    const thumb = article.cover_url || article.image_url;
    const snippet = article.excerpt?.trim() ?? '';

    return (
        <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-zinc-800">
            {thumb ? (
                <div className="relative">
                    <NewsPostCover
                        imageSrc={imageSrc(thumb, appUrl)}
                        detailHref={route('mobile.vida-e-saude.show', article.slug)}
                        aspectClass={featured ? 'aspect-[16/10] lg:aspect-[16/9] lg:min-h-[18rem]' : 'aspect-[16/10]'}
                        onImageError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = 'none';
                            const next = el.nextElementSibling as HTMLElement | null;
                            if (next) next.style.display = 'flex';
                        }}
                        imageFallback={
                            <div
                                className="absolute inset-0 hidden items-center justify-center bg-zinc-200 dark:bg-zinc-700"
                                style={{ display: 'none' }}
                                aria-hidden
                            >
                                <NewspaperIcon className="h-12 w-12 text-zinc-400" />
                            </div>
                        }
                        overlaySlot={
                            <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                                {article.section_label}
                            </span>
                        }
                    />
                </div>
            ) : (
                <Link
                    href={route('mobile.vida-e-saude.show', article.slug)}
                    className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                    <div className={`relative flex items-center justify-center bg-gradient-to-br from-teal-50 via-zinc-50 to-emerald-50 dark:from-teal-950/40 dark:via-zinc-900 dark:to-emerald-950/30 ${featured ? 'h-52' : 'h-36'}`}>
                        <NewspaperIcon className="h-12 w-12 text-teal-700/50 dark:text-teal-300/70" />
                        <span className="absolute left-2 top-2 rounded-lg bg-zinc-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                            {article.section_label}
                        </span>
                    </div>
                </Link>
            )}
            <div className="flex flex-1 flex-col p-4">
                <Link href={route('mobile.vida-e-saude.show', article.slug)} className="group cursor-pointer">
                    <h3 className={`line-clamp-2 font-semibold leading-snug text-zinc-900 group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400 ${featured ? 'text-lg' : 'text-base'}`}>
                        {article.title}
                    </h3>
                </Link>
                {article.author_name && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{article.author_name}</p>
                )}
                {snippet && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {snippet}
                    </p>
                )}
            </div>
        </article>
    );
}

export default function MobileVidaSaude({ latest, groups, articles, sections, filters }: Props) {
    const appUrl = (usePage().props as { appUrl?: string }).appUrl ?? '';
    const activeSection = filters.section;
    const activeSearch = filters.q;
    const filtered = Boolean(activeSection || activeSearch);
    const [searchQuery, setSearchQuery] = useState(activeSearch ?? '');
    const lastAppliedSearchRef = useRef(activeSearch ?? '');
    const searchBelowMinimum = isListSearchBelowMinimum(searchQuery);
    const isEmpty = filtered ? (articles?.data.length ?? 0) === 0 : latest.length === 0;

    useEffect(() => {
        setSearchQuery(activeSearch ?? '');
        lastAppliedSearchRef.current = activeSearch ?? '';
    }, [activeSearch]);

    useEffect(() => {
        const resolved = serverSearchTerm(searchQuery);
        const applied = lastAppliedSearchRef.current;
        const next = resolved ?? '';

        if (next === applied) return;

        const timer = window.setTimeout(() => {
            lastAppliedSearchRef.current = next;
            router.get(route('mobile.vida-e-saude'), buildQuery(activeSection, resolved ?? null), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, LIST_SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchQuery, activeSection]);

    const applySection = (section: string | null) => {
        router.get(route('mobile.vida-e-saude'), buildQuery(section, activeSearch), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        lastAppliedSearchRef.current = '';
        setSearchQuery('');
        router.get(route('mobile.vida-e-saude'), buildQuery(activeSection, null), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const chipClass = (active: boolean) =>
        `cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
            active
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
        }`;

    return (
        <MobileLayout>
            <Head title="Vida e Saúde" />
            <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-8">
                <header className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800 dark:text-teal-200">Revista</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Vida e Saúde</h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        As últimas publicações e os artigos separados pelas áreas da revista.
                    </p>
                </header>

                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar artigo, autor ou tema"
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-10 text-sm text-zinc-900 shadow-sm outline-none ring-teal-600/30 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    {searchQuery !== '' && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Limpar busca"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                    <ListSearchHint show={searchBelowMinimum} className="mt-1" />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => applySection(null)} className={chipClass(activeSection === null)}>
                        Todos
                    </button>
                    {sections.map((section) => (
                        <button
                            key={section.value}
                            type="button"
                            onClick={() => applySection(section.value)}
                            className={chipClass(activeSection === section.value)}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>

                {isEmpty ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
                        <NewspaperIcon className="mx-auto h-10 w-10 text-zinc-400" />
                        <p className="mt-3 font-medium text-zinc-800 dark:text-zinc-100">Nenhum artigo por aqui</p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {activeSearch || activeSection
                                ? 'Tente outras palavras ou outra área.'
                                : 'Os conteúdos serão sincronizados automaticamente.'}
                        </p>
                    </div>
                ) : filtered && articles ? (
                    <>
                        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.data.map((article) => (
                                <li key={article.id} className="min-w-0">
                                    <ArticleCard article={article} appUrl={appUrl} />
                                </li>
                            ))}
                        </ul>
                        {articles.last_page > 1 && (
                            <nav className="flex flex-wrap justify-center gap-2" aria-label="Paginação">
                                {articles.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex min-w-[2.25rem] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm ${
                                                link.active
                                                    ? 'border-teal-600 bg-teal-600 text-white'
                                                    : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="inline-flex min-w-[2.25rem] cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ),
                                )}
                            </nav>
                        )}
                    </>
                ) : (
                    <div className="space-y-10">
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Últimas publicações</h2>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                                {latest[0] && (
                                    <div className="min-w-0 lg:col-span-3">
                                        <ArticleCard article={latest[0]} appUrl={appUrl} featured />
                                    </div>
                                )}
                                {latest.length > 1 && (
                                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                                        {latest.slice(1).map((article) => (
                                            <ArticleCard key={article.id} article={article} appUrl={appUrl} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {groups.map((group) => (
                            <section key={group.slug} className="space-y-3">
                                <div className="flex items-end justify-between gap-3">
                                    <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{group.label}</h2>
                                    <button
                                        type="button"
                                        onClick={() => applySection(group.slug)}
                                        className="cursor-pointer text-sm font-medium text-teal-800 hover:underline dark:text-teal-200"
                                    >
                                        Ver área
                                    </button>
                                </div>
                                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {group.articles.map((article) => (
                                        <li key={article.id} className="min-w-0">
                                            <ArticleCard article={article} appUrl={appUrl} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
