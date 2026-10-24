import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { WeeklyProgramHomeCardData } from '@/Components/Mobile/WeeklyProgramHomeCard';

type Props = {
    cards: WeeklyProgramHomeCardData[];
    href?: string | null;
};

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
    return null;
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
            <div className="flex min-w-0 touch-auto snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cards.map((card) => {
                    const status = statusOf(card);
                    const time = formatTime(card.time_display);
                    const label = `${status ? `${status}: ` : ''}${card.title}, ${time}`;
                    const chipClass = `flex w-[8.6rem] shrink-0 snap-start flex-col justify-between rounded-2xl px-3 py-2.5 ring-1 ${
                        card.is_ongoing
                            ? 'bg-[#dff3e6] ring-emerald-700/20 dark:bg-emerald-950/70 dark:ring-emerald-400/30'
                            : 'bg-[#e8f6ee] ring-emerald-900/10 dark:bg-emerald-950/45 dark:ring-emerald-800/50'
                    }`;
                    const body = (
                        <>
                            <p className="line-clamp-2 text-[12px] font-medium leading-tight text-emerald-950/80 dark:text-emerald-50/90">
                                {card.title}
                            </p>
                            <p
                                className={`mt-1 font-semibold leading-none tracking-tight text-emerald-950 dark:text-emerald-50 ${
                                    time.length > 8 ? 'text-[15px]' : 'text-[1.2rem]'
                                }`}
                            >
                                {time}
                            </p>
                            {status ? (
                                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-200">
                                    {status}
                                </p>
                            ) : null}
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
                            className={`${chipClass} cursor-pointer transition hover:bg-[#dff3e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:hover:bg-emerald-950/70`}
                        >
                            {body}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
