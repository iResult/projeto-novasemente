import MobileLayout from '@/Layouts/MobileLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useNsTimerFollow } from '@/hooks/useNsTimerFollow';
import {
    isNsTimerFollowAvailable,
    type NsTimerFollow,
    type NsTimerStage,
} from '@/utils/nsTimerFollow';

type Props = {
    follow: NsTimerFollow;
};

function stageCountLabel(count: number): string {
    return count === 1 ? '1 etapa' : `${count} etapas`;
}

function StageRow({ stage, itemRef }: { stage: NsTimerStage; itemRef?: (node: HTMLLIElement | null) => void }) {
    const current = stage.state === 'current';
    const done = stage.state === 'done';

    return (
        <li
            ref={itemRef}
            aria-current={current ? 'step' : undefined}
            className={[
                'rounded-xl px-3 py-2.5 ring-1 ring-inset md:grid md:grid-cols-[4.5rem_minmax(0,1fr)_auto] md:items-start md:gap-3 md:px-4',
                current
                    ? 'bg-teal-50/90 ring-teal-200 dark:bg-teal-950/40 dark:ring-teal-800'
                    : 'bg-white ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700',
                done ? 'opacity-60' : '',
            ].join(' ')}
        >
            <div className="flex items-baseline justify-between gap-3 md:block">
                {stage.start_time ? (
                    <p
                        className={[
                            'text-sm font-semibold tabular-nums',
                            current ? 'text-teal-900 dark:text-teal-100' : 'text-zinc-900 dark:text-zinc-100',
                        ].join(' ')}
                    >
                        {stage.start_time}
                    </p>
                ) : (
                    <span className="md:hidden" />
                )}
                {stage.duration_label ? (
                    <p className="text-xs font-medium text-zinc-500 md:hidden dark:text-zinc-400">{stage.duration_label}</p>
                ) : null}
            </div>
            <div className="mt-1 min-w-0 md:mt-0">
                {current ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-800 dark:text-teal-200">
                        Agora
                    </p>
                ) : null}
                <p
                    className={[
                        'text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50',
                        current ? 'mt-0.5' : '',
                    ].join(' ')}
                >
                    {stage.name}
                </p>
                {stage.responsible ? (
                    <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{stage.responsible}</p>
                ) : null}
                {stage.notes ? (
                    <p className="mt-1 text-sm leading-snug text-zinc-600 dark:text-zinc-300">{stage.notes}</p>
                ) : null}
            </div>
            {stage.duration_label ? (
                <p className="hidden text-xs font-medium text-zinc-500 md:block dark:text-zinc-400">{stage.duration_label}</p>
            ) : (
                <span className="hidden md:block" />
            )}
        </li>
    );
}

export default function AcompanharCulto({ follow: initial }: Props) {
    const follow = useNsTimerFollow({
        initial,
        pollUrl: route('mobile.acompanhar-culto.live'),
    });
    const [teamOpen, setTeamOpen] = useState(false);
    const currentRef = useRef<HTMLLIElement | null>(null);
    const currentId = isNsTimerFollowAvailable(follow)
        ? (follow.sections.flatMap((section) => section.stages).find((stage) => stage.state === 'current')?.id ?? null)
        : null;

    useEffect(() => {
        currentRef.current?.scrollIntoView({ block: 'nearest' });
    }, [currentId]);

    return (
        <MobileLayout>
            <Head title="Acompanhar culto" />
            <div className="mx-auto w-full max-w-lg space-y-4 pb-6 sm:max-w-xl md:max-w-3xl">
                <div>
                    <Link
                        href={route('mobile.home')}
                        className="cursor-pointer text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                    >
                        ← Início
                    </Link>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                        Acompanhar culto
                    </h1>
                </div>

                {!isNsTimerFollowAvailable(follow) ? (
                    <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                        Nenhuma programação no momento.
                    </p>
                ) : (
                    <>
                        <section className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={[
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                                        follow.live
                                            ? 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-100 dark:ring-teal-800'
                                            : 'bg-zinc-50 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
                                    ].join(' ')}
                                >
                                    {follow.live ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-300" aria-hidden />
                                    ) : null}
                                    {follow.status_label}
                                </span>
                            </div>
                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                                {follow.title}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {[
                                    follow.date_label,
                                    follow.start_time,
                                    stageCountLabel(follow.stage_count),
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </section>

                        {follow.team.length > 0 ? (
                            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
                                <button
                                    type="button"
                                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
                                    aria-expanded={teamOpen}
                                    onClick={() => setTeamOpen((open) => !open)}
                                >
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Informações do time técnico
                                    </span>
                                    <ChevronDownIcon
                                        className={[
                                            'h-5 w-5 shrink-0 text-zinc-500 transition',
                                            teamOpen ? 'rotate-180' : '',
                                        ].join(' ')}
                                        aria-hidden
                                    />
                                </button>
                                {teamOpen ? (
                                    <dl className="space-y-3 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                                        {follow.team.map((row) => (
                                            <div key={`${row.label}:${row.value}`}>
                                                {row.label ? (
                                                    <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                                        {row.label}
                                                    </dt>
                                                ) : null}
                                                <dd className="text-sm leading-snug text-zinc-800 dark:text-zinc-100">
                                                    {row.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : null}
                            </section>
                        ) : null}

                        {follow.stage_count === 0 ? (
                            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                                Nenhuma etapa nesta programação.
                            </p>
                        ) : (
                            <div className="space-y-5">
                                {follow.sections.map((section, sectionIndex) => (
                                    <section key={`${section.title ?? 'etapas'}-${sectionIndex}`} className="space-y-2">
                                        {section.title ? (
                                            <div className="flex items-baseline justify-between gap-3 px-1">
                                                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                                                    {section.title}
                                                </h3>
                                                <p className="shrink-0 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                                                    {stageCountLabel(section.stages.length)}
                                                </p>
                                            </div>
                                        ) : null}
                                        <ol className="space-y-2">
                                            {section.stages.map((stage) => (
                                                <StageRow
                                                    key={stage.id}
                                                    stage={stage}
                                                    itemRef={
                                                        stage.state === 'current'
                                                            ? (node) => {
                                                                  currentRef.current = node;
                                                              }
                                                            : undefined
                                                    }
                                                />
                                            ))}
                                        </ol>
                                    </section>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </MobileLayout>
    );
}
