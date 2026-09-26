import { CheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
    computeToggleLiveIndex,
    isLiveFinished,
} from '@/utils/saturdayProgramLive';

export type ScheduleCrewRow = { role: string; names: string };

export type ScheduleItemRow =
    | {
          kind: 'item';
          start: string;
          duration?: string | null;
          title: string;
          person?: string | null;
          notes?: string | null;
      }
    | {
          kind: 'section';
          title: string;
      };

export type SaturdaySchedule = {
    version?: number;
    heading?: string | null;
    date_label?: string | null;
    crew?: ScheduleCrewRow[];
    items?: ScheduleItemRow[];
};

type Props = {
    schedule: SaturdaySchedule;
    fallbackDateLabel?: string | null;
    /** ADM pode marcar/passar itens. Membros só acompanham. */
    canConduct?: boolean;
    /** Índice do item atual na passagem ao vivo (`items.length` = concluída). `null` = ainda não iniciada. */
    liveCurrentIndex?: number | null;
    livePending?: boolean;
    onLiveIndexChange?: (nextIndex: number | null) => void;
};

type TimedItem = {
    index: number;
    startMin: number;
    endMin: number;
    row: Extract<ScheduleItemRow, { kind: 'item' }>;
};

function pad2(n: number): string {
    return String(Math.floor(n)).padStart(2, '0');
}

/** Exibe 09:00 (ou 09:26:30 se houver segundos relevantes). */
export function formatScheduleClock(raw: string): string {
    const parts = raw.trim().split(':');
    if (parts.length < 2) return raw;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = parts.length >= 3 ? Number(parts[2]) : 0;
    if (Number.isNaN(h) || Number.isNaN(m)) return raw;
    if (!Number.isNaN(s) && s > 0) {
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }
    return `${pad2(h)}:${pad2(m)}`;
}

function parseTimeToMinutes(raw: string): number | null {
    const parts = raw.trim().split(':').map((p) => Number(p));
    if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
    const [h, m, s = 0] = parts;
    return h * 60 + m + s / 60;
}

/** Duração no PDF costuma ser mm:ss (ex.: 3:00 = 3 min). */
function parseDurationToMinutes(raw: string | null | undefined): number | null {
    if (!raw) return null;
    const cleaned = raw.replace(/in\s*mins?/i, '').trim();
    const parts = cleaned.split(':').map((p) => Number(p));
    if (parts.length === 1 && !Number.isNaN(parts[0])) return parts[0];
    if (parts.length >= 2 && !parts.some((n) => Number.isNaN(n))) {
        return parts[0] + parts[1] / 60;
    }
    return null;
}

function formatDurationLabel(raw: string | null | undefined): string | null {
    const mins = parseDurationToMinutes(raw);
    if (mins == null) return raw?.trim() || null;
    if (mins < 1) {
        const secs = Math.round(mins * 60);
        return `${secs}s`;
    }
    const whole = Math.round(mins * 10) / 10;
    if (Number.isInteger(whole)) return `${whole} min`;
    return `${whole.toFixed(1).replace('.', ',')} min`;
}

function nowMinutesOfDay(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function normalizeScheduleLabel(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim()
        .toLowerCase();
}

export function shouldHideScheduleItemTitle(title: string): boolean {
    const normalized = normalizeScheduleLabel(title);
    const hiddenLabels = [
        'introducao a fidelidade',
        'introducao a fdelidade',
        'introducao de fidelidade',
        'introducao fidelidade',
        'momento de oracao',
        'entrada do vocal',
    ];

    return hiddenLabels.some(
        (label) => normalized === label || normalized.startsWith(`${label} `),
    );
}

function cultoNumber(title: string): 1 | 2 | null {
    const normalized = normalizeScheduleLabel(title);
    if (/^(1|1o|primeiro) culto\b/.test(normalized)) return 1;
    if (/^(2|2o|segundo) culto\b/.test(normalized)) return 2;
    return null;
}

function CultoDivider({ number }: { number: 1 | 2 }) {
    const isFirst = number === 1;

    return (
        <div className="sticky top-0 z-[1] -mx-1 px-1 py-1.5">
            <div
                className={[
                    'rounded-xl px-3 py-2.5 text-center ring-1 ring-inset backdrop-blur',
                    isFirst
                        ? 'bg-teal-50/95 ring-teal-200/80 dark:bg-teal-950/90 dark:ring-teal-800/80'
                        : 'bg-amber-50/95 ring-amber-200/80 dark:bg-amber-950/80 dark:ring-amber-800/70',
                ].join(' ')}
            >
                <p
                    className={[
                        'text-[11px] font-bold uppercase tracking-[0.12em]',
                        isFirst
                            ? 'text-teal-800 dark:text-teal-200'
                            : 'text-amber-800 dark:text-amber-200',
                    ].join(' ')}
                >
                    {number}º culto
                </p>
            </div>
        </div>
    );
}

function buildTimedItems(items: ScheduleItemRow[]): TimedItem[] {
    const timed: TimedItem[] = [];
    items.forEach((row, index) => {
        if (row.kind !== 'item') return;
        const startMin = parseTimeToMinutes(row.start);
        if (startMin == null) return;
        timed.push({ index, startMin, endMin: startMin + 5, row });
    });

    for (let i = 0; i < timed.length; i++) {
        const cur = timed[i];
        const next = timed[i + 1];
        const fromDuration = parseDurationToMinutes(cur.row.duration);
        let end = cur.startMin + (fromDuration && fromDuration > 0 ? fromDuration : 5);
        if (next && next.startMin > cur.startMin) {
            end = Math.min(end, next.startMin);
            if (fromDuration == null || fromDuration <= 0) {
                end = next.startMin;
            }
        }
        cur.endMin = Math.max(end, cur.startMin + 0.5);
    }

    return timed;
}

export default function SaturdayProgramScheduleView({
    schedule,
    fallbackDateLabel = null,
    canConduct = false,
    liveCurrentIndex = null,
    livePending = false,
    onLiveIndexChange,
}: Props) {
    const items = schedule.items ?? [];
    const [nowMin, setNowMin] = useState(nowMinutesOfDay);
    const currentRef = useRef<HTMLElement | null>(null);
    const didScrollRef = useRef(false);
    const liveActive = liveCurrentIndex !== null;

    useEffect(() => {
        const tick = () => setNowMin(nowMinutesOfDay());
        tick();
        const id = window.setInterval(tick, 15_000);
        return () => window.clearInterval(id);
    }, []);

    const dateLabel = schedule.date_label?.trim() || fallbackDateLabel || null;
    const timedItems = useMemo(() => buildTimedItems(items), [items]);
    const finished = isLiveFinished(items, liveCurrentIndex);

    const clockTimedIndex = useMemo(() => {
        const hit = timedItems.findIndex((t) => nowMin >= t.startMin && nowMin < t.endMin);
        if (hit >= 0) return hit;
        const upcoming = timedItems.findIndex((t) => t.startMin > nowMin && t.startMin - nowMin <= 2);
        return upcoming;
    }, [timedItems, nowMin]);

    const currentItemIndex = liveActive
        ? finished
            ? -1
            : liveCurrentIndex
        : clockTimedIndex >= 0
          ? timedItems[clockTimedIndex]?.index ?? -1
          : -1;

    useEffect(() => {
        if (currentItemIndex < 0) return;
        if (!liveActive && didScrollRef.current) return;
        const el = currentRef.current;
        if (!el) return;
        didScrollRef.current = true;
        window.requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }, [currentItemIndex, liveActive, items.length]);

    const passedCount = useMemo(() => {
        if (!liveActive) return 0;
        let n = 0;
        items.forEach((row, index) => {
            if (row.kind === 'item' && index < (liveCurrentIndex ?? 0)) n += 1;
        });
        return n;
    }, [items, liveActive, liveCurrentIndex]);

    const itemTotal = timedItems.length;
    const firstItemIndex = items.findIndex((row) => row.kind === 'item');
    const hasFirstCultoDivider = items.some(
        (row) => row.kind === 'section' && cultoNumber(row.title) === 1,
    );

    const handleToggle = (index: number) => {
        if (!canConduct || !onLiveIndexChange || livePending) return;
        onLiveIndexChange(computeToggleLiveIndex(items, liveCurrentIndex, index));
    };

    const handleReset = () => {
        if (!canConduct || !onLiveIndexChange || livePending) return;
        onLiveIndexChange(null);
    };

    return (
        <div className="space-y-5">
            {(schedule.heading || dateLabel) && (
                <header className="space-y-1">
                    {schedule.heading ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                            {schedule.heading}
                        </p>
                    ) : null}
                    {dateLabel ? (
                        <p className="text-sm font-medium capitalize text-zinc-500 dark:text-zinc-400">
                            {dateLabel}
                        </p>
                    ) : null}
                </header>
            )}

            {itemTotal > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {liveActive ? (
                        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                            {finished ? (
                                'Programação concluída'
                            ) : (
                                <>
                                    Ao vivo
                                    {passedCount > 0 ? (
                                        <span className="text-zinc-400 dark:text-zinc-500">
                                            {' '}
                                            · {passedCount}/{itemTotal}
                                        </span>
                                    ) : null}
                                </>
                            )}
                        </p>
                    ) : canConduct ? (
                        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                            Toque no ✓ para iniciar a passagem. A igreja vê o momento atual.
                        </p>
                    ) : (
                        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                            O destaque segue o horário até a equipe iniciar a passagem.
                        </p>
                    )}
                    {canConduct && liveActive ? (
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={livePending}
                            className="cursor-pointer text-[12px] font-semibold text-teal-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300"
                        >
                            Reiniciar passagem
                        </button>
                    ) : null}
                </div>
            ) : null}

            <section aria-label="Timeline da programação" className="space-y-2.5">
                {items.map((row, index) => {
                    if (row.kind === 'section') {
                        const sectionCultoNumber = cultoNumber(row.title);
                        if (sectionCultoNumber !== null) {
                            return (
                                <CultoDivider
                                    key={`section-${index}-${row.title}`}
                                    number={sectionCultoNumber}
                                />
                            );
                        }

                        return (
                            <div
                                key={`section-${index}-${row.title}`}
                                className="sticky top-0 z-[1] -mx-1 px-1 py-1.5"
                            >
                                <div className="rounded-xl bg-zinc-100/95 px-3 py-2.5 text-center backdrop-blur dark:bg-zinc-800/95">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300">
                                        {row.title}
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    const done = liveActive && !finished && liveCurrentIndex != null && index < liveCurrentIndex;
                    const doneFinished = finished;
                    const isDone = done || doneFinished;
                    const isNow = index === currentItemIndex;
                    const timed = timedItems.find((t) => t.index === index);
                    const isPastByClock = !liveActive && timed != null && nowMin >= timed.endMin && !isNow;
                    const durationLabel = formatDurationLabel(row.duration ?? null);
                    const showTitle = !shouldHideScheduleItemTitle(row.title);

                    return (
                        <Fragment key={`item-${index}-${row.start}-${row.title}`}>
                            {index === firstItemIndex && !hasFirstCultoDivider ? (
                                <CultoDivider number={1} />
                            ) : null}
                            <article
                                ref={isNow ? currentRef : undefined}
                                aria-current={isNow ? 'true' : undefined}
                                aria-label={showTitle ? undefined : `${formatScheduleClock(row.start)} — item da programação`}
                                className={[
                                    'relative overflow-hidden rounded-2xl p-3.5 shadow-sm transition-colors',
                                    canConduct ? 'pr-12' : '',
                                    isNow
                                        ? 'bg-teal-50 ring-2 ring-teal-500/80 dark:bg-teal-950 dark:ring-teal-400'
                                        : isDone
                                          ? 'bg-zinc-100/90 ring-1 ring-zinc-200/80 dark:bg-zinc-800/60 dark:ring-zinc-700/80'
                                          : isPastByClock
                                            ? 'bg-white/80 ring-1 ring-zinc-200/70 opacity-80 dark:bg-zinc-900/70 dark:ring-zinc-700/70'
                                            : 'bg-white ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700',
                                ].join(' ')}
                            >
                            {isNow ? (
                                <span className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-teal-500 dark:bg-teal-400" />
                            ) : null}

                            {canConduct ? (
                                <button
                                    type="button"
                                    onClick={() => handleToggle(index)}
                                    disabled={livePending}
                                    aria-pressed={isDone}
                                    aria-label={
                                        isNow
                                            ? 'Passar este item'
                                            : isDone
                                              ? 'Voltar a este item'
                                              : 'Ir para este item'
                                    }
                                    title={
                                        isNow
                                            ? 'Passar'
                                            : isDone
                                              ? 'Voltar a este ponto'
                                              : 'Iniciar / ir para este ponto'
                                    }
                                    className={[
                                        'absolute right-2.5 top-2.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
                                        isDone
                                            ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500'
                                            : 'bg-white text-zinc-400 ring-1 ring-zinc-200 hover:text-teal-700 hover:ring-teal-300 dark:bg-zinc-900 dark:text-zinc-500 dark:ring-zinc-600 dark:hover:text-teal-300',
                                    ].join(' ')}
                                >
                                    {isDone ? (
                                        <CheckIconSolid className="h-4 w-4" aria-hidden />
                                    ) : (
                                        <CheckIcon className="h-4 w-4" aria-hidden />
                                    )}
                                </button>
                            ) : null}

                            <div className="flex gap-3.5">
                                <div className="w-[4.5rem] shrink-0 pt-0.5 text-right">
                                    <p
                                        className={[
                                            'font-bold tabular-nums leading-none tracking-tight',
                                            isNow
                                                ? 'text-[1.35rem] text-teal-800 dark:text-teal-100'
                                                : isDone
                                                  ? 'text-[1.15rem] text-zinc-400 dark:text-zinc-500'
                                                  : 'text-[1.2rem] text-zinc-900 dark:text-zinc-50',
                                        ].join(' ')}
                                    >
                                        {formatScheduleClock(row.start)}
                                    </p>
                                    {durationLabel ? (
                                        <p
                                            className={[
                                                'mt-1.5 text-[11px] font-semibold tabular-nums',
                                                isNow
                                                    ? 'text-teal-700/90 dark:text-teal-300/90'
                                                    : 'text-zinc-400 dark:text-zinc-500',
                                            ].join(' ')}
                                        >
                                            {durationLabel}
                                        </p>
                                    ) : null}
                                    {isNow ? (
                                        <span className="mt-2 inline-flex items-center rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-teal-400 dark:text-teal-950">
                                            Agora
                                        </span>
                                    ) : null}
                                </div>

                                <div
                                    className={[
                                        'mt-1 w-px shrink-0 self-stretch',
                                        isNow
                                            ? 'bg-teal-400 dark:bg-teal-500'
                                            : 'bg-gradient-to-b from-zinc-300 via-zinc-200 to-transparent dark:from-zinc-600 dark:via-zinc-700',
                                    ].join(' ')}
                                    aria-hidden
                                />

                                <div className="min-w-0 flex-1">
                                    {showTitle ? (
                                        <h3
                                            className={[
                                                'text-[15px] font-semibold leading-snug',
                                                isDone
                                                    ? 'text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-400 dark:decoration-zinc-600'
                                                    : isNow
                                                      ? 'text-zinc-950 dark:text-white'
                                                      : 'text-zinc-900 dark:text-white',
                                            ].join(' ')}
                                        >
                                            {row.title}
                                        </h3>
                                    ) : null}
                                </div>
                            </div>
                            </article>
                        </Fragment>
                    );
                })}
            </section>
        </div>
    );
}
