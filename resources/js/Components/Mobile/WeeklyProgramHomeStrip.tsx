import { Link } from '@inertiajs/react';
import { BookOpenIcon, CalendarDaysIcon, ChevronRightIcon, PlayIcon, SunIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { WeeklyProgramHomeCardData } from '@/Components/Mobile/WeeklyProgramHomeCard';

type Props = {
    cards: WeeklyProgramHomeCardData[];
    href?: string | null;
};

type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

function formatTime(raw: string): string {
    const clock = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (clock) {
        const hour = String(Number(clock[1]));
        return clock[2] === '00' ? `${hour}h` : `${hour}h${clock[2]}`;
    }
    return raw.trim();
}

function statusOf(card: WeeklyProgramHomeCardData): string | null {
    if (card.is_ongoing) {
        return 'Em andamento';
    }
    if (card.is_next) {
        return 'Próximo';
    }
    return 'Mais tarde';
}

function iconFor(title: string): MenuIcon {
    const name = title.toLocaleLowerCase('pt-BR');
    if (name.includes('pôr') || name.includes('por do sol')) {
        return SunIcon;
    }
    if (name.includes('culto') || name.includes('despedida') || name.includes('início') || name.includes('inicio')) {
        return PlayIcon;
    }
    if (name.includes('estudo') || name.includes('classe') || name.includes('lição') || name.includes('licao')) {
        return BookOpenIcon;
    }
    return CalendarDaysIcon;
}

function sectionTitle(cards: WeeklyProgramHomeCardData[]): string {
    const days = cards.map((card) => card.day_label.trim().toLocaleLowerCase('pt-BR'));
    if (days.length > 0 && days.every((day) => day === 'sábado' || day === 'sabado')) {
        return 'Programação de sábado';
    }
    return 'Programação';
}

export default function WeeklyProgramHomeStrip({ cards, href = null }: Props) {
    if (cards.length === 0) {
        return null;
    }

    const title = sectionTitle(cards);

    return (
        <section aria-labelledby="home-programacao-titulo" className="min-w-0">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <h2
                    id="home-programacao-titulo"
                    className="min-w-0 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    {title}
                </h2>
                {href ? (
                    <Link
                        href={href}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 text-[13px] font-medium text-brand-800 hover:text-brand-700 dark:text-brand-200 dark:hover:text-brand-100"
                    >
                        Ver todos
                        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
                    </Link>
                ) : null}
            </div>
            <div className="flex min-w-0 touch-auto snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-ps-0 scroll-pe-4 pe-4 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pe-0 md:scroll-pe-0 [&::-webkit-scrollbar]:hidden">
                {cards.map((card) => {
                    const status = statusOf(card);
                    const time = formatTime(card.time_display);
                    const Icon = iconFor(card.title);
                    const label = `${status}: ${card.title}, ${time}`;
                    const chipClass = `flex w-[9.1rem] shrink-0 snap-start items-center justify-between gap-2 rounded-2xl px-3 py-2.5 md:w-auto md:min-w-[10.5rem] md:flex-1 ${
                        card.is_ongoing
                            ? 'bg-[#e5f6eb] ring-1 ring-emerald-700/15 dark:bg-emerald-950/80 dark:ring-emerald-400/25'
                            : 'bg-white ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-800'
                    }`;
                    const body = (
                        <>
                            <div className="min-w-0">
                                <p className="line-clamp-2 text-[11px] font-semibold uppercase leading-tight tracking-wide text-zinc-500 dark:text-zinc-400">
                                    {card.title}
                                </p>
                                <p className="mt-1 text-[1.35rem] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                                    {time}
                                </p>
                                <p
                                    className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium leading-none ${
                                        card.is_ongoing
                                            ? 'text-brand-800 dark:text-brand-200'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            card.is_ongoing ? 'bg-brand-700 dark:bg-brand-300' : 'bg-zinc-300 dark:bg-zinc-600'
                                        }`}
                                        aria-hidden
                                    />
                                    {status}
                                </p>
                            </div>
                            <Icon
                                className={`h-4 w-4 shrink-0 ${
                                    card.is_ongoing ? 'text-brand-800 dark:text-brand-200' : 'text-zinc-400 dark:text-zinc-500'
                                }`}
                                aria-hidden
                                strokeWidth={1.75}
                            />
                        </>
                    );

                    if (!href) {
                        return (
                            <div key={card.id} className={chipClass} aria-label={label}>
                                {body}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={card.id}
                            href={href}
                            aria-label={label}
                            className={`${chipClass} cursor-pointer transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:hover:bg-zinc-800`}
                        >
                            {body}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
