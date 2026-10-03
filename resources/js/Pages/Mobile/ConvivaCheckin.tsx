import MobileLayout from '@/Layouts/MobileLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { convivaColorFor } from '@/constants/convivaColors';

type ConvivaClassOption = {
    id: number;
    room_name: string;
    teacher_name: string;
};

type TodayCheckin = {
    id: number;
    class_id: number;
    room_name: string | null;
    teacher_name: string | null;
    checked_in_at: string | null;
};

type Classmate = {
    id: number;
    name: string;
    photo_url: string | null;
};

interface Props {
    classes: ConvivaClassOption[];
    suggestedClassId: number | null;
    isSaturday: boolean;
    checkinOpen: boolean;
    today: string;
    todayLabel: string;
    checkin: TodayCheckin | null;
    classmates?: Classmate[];
}

function Header({ todayLabel, showDate = true }: { todayLabel: string; showDate?: boolean }) {
    return (
        <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Estudo bíblico
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">CONVIVA</h1>
            {showDate ? <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{todayLabel}</p> : null}
        </div>
    );
}

export default function ConvivaCheckin({
    classes,
    suggestedClassId,
    isSaturday,
    checkinOpen,
    todayLabel,
    checkin,
    classmates = [],
}: Props) {
    const page = usePage();
    const fullName = (page.props.auth as { user?: { name?: string } } | undefined)?.user?.name ?? '';
    const firstName = fullName.trim().split(/\s+/)[0] || 'Você';
    const [selectedId, setSelectedId] = useState<number | null>(
        checkin?.class_id ?? suggestedClassId,
    );
    const [submitting, setSubmitting] = useState(false);
    const [changing, setChanging] = useState(false);
    const [classOpen, setClassOpen] = useState(false);

    useEffect(() => {
        setSelectedId(checkin?.class_id ?? suggestedClassId);
    }, [checkin?.class_id, suggestedClassId]);

    const sameAsSaved = checkin != null && selectedId === checkin.class_id;
    const canSubmit = checkinOpen && selectedId != null && !submitting && classes.length > 0 && !sameAsSaved;

    const doCheckin = () => {
        if (!canSubmit || selectedId == null) return;
        setSubmitting(true);
        router.post(
            route('mobile.conviva.checkin.store'),
            { conviva_class_id: selectedId },
            {
                preserveScroll: true,
                onSuccess: () => setChanging(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    if (checkin && !changing) {
        const color = convivaColorFor(checkin.room_name);

        return (
            <MobileLayout>
                <Head title="CONVIVA" />
                <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 text-center">
                    <Header todayLabel={todayLabel} showDate={false} />

                    <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <CheckIcon className="h-10 w-10" />
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                        Check-in realizado!
                    </h2>

                    <div className={`w-full rounded-3xl px-6 pb-5 pt-7 text-left shadow-md ${color.plate} ${color.label}`}>
                        <div className="flex items-start justify-between gap-4">
                            <p className="min-w-0 truncate text-4xl font-semibold leading-none tracking-tight">
                                {firstName}
                            </p>
                            {checkin.checked_in_at ? (
                                <p className="shrink-0 pt-1.5 text-lg font-medium tabular-nums leading-none">
                                    {checkin.checked_in_at}
                                </p>
                            ) : null}
                        </div>
                        <p className="mt-4 text-sm font-medium leading-none tracking-wide">{todayLabel}</p>
                        <div className="mt-8 flex items-center gap-3 border-t border-current/25 pt-4">
                            <span className="inline-flex shrink-0 rounded-full p-px ring-2 ring-current" aria-hidden>
                                <span className={`block h-3 w-3 rounded-full ${color.dot}`} />
                            </span>
                            <p className="min-w-0 truncate text-xl font-semibold uppercase leading-none tracking-wide">
                                Classe {checkin.room_name}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setClassOpen(true)}
                        className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:focus-visible:ring-white"
                    >
                        Conheça sua classe de hoje
                    </button>

                    <Modal show={classOpen} maxWidth="md" onClose={() => setClassOpen(false)}>
                        <div className="p-5">
                            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                                Conheça sua classe de hoje
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {classmates.length === 1
                                    ? '1 pessoa fez check-in na classe ' + (checkin.room_name ?? '') + '.'
                                    : `${classmates.length} pessoas fizeram check-in na classe ${checkin.room_name ?? ''}.`}
                            </p>
                            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                                {classmates.map((person) => (
                                    <li key={person.id} className="flex items-center gap-3 py-3">
                                        {person.photo_url ? (
                                            <img
                                                src={person.photo_url}
                                                alt=""
                                                className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                                            />
                                        ) : (
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                                                {person.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="min-w-0 truncate text-base font-medium text-zinc-950 dark:text-white">
                                            {person.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Modal>

                    <div className="mt-1 flex flex-col items-center gap-3">
                        {checkinOpen ? (
                            <button
                                type="button"
                                onClick={() => setChanging(true)}
                                className="cursor-pointer text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300"
                            >
                                Alterar check-in
                            </button>
                        ) : null}
                        <Link
                            href={route('mobile.home')}
                            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:focus-visible:ring-white"
                        >
                            Voltar ao início
                        </Link>
                    </div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout>
            <Head title="CONVIVA" />

            <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
                <Header todayLabel={todayLabel} />

                {checkinOpen ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                            <CalendarDaysIcon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-medium leading-snug">
                            {isSaturday
                                ? 'Check-in liberado hoje, no culto.'
                                : 'Check-in liberado hoje para o treinamento.'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                        O check-in do CONVIVA fica disponível aos sábados, no culto.
                    </div>
                )}

                <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">Sua classe</h2>
                    {classes.length === 0 ? (
                        <div className="mt-3 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                            Nenhuma classe ativa no momento. Peça à secretaria para cadastrar.
                        </div>
                    ) : (
                        <ul className="mt-3 flex flex-col gap-2">
                            {classes.map((c) => {
                                const selected = selectedId === c.id;
                                const yours = suggestedClassId === c.id && !selected;
                                const color = convivaColorFor(c.room_name);
                                const branca = c.room_name === 'Branca';

                                return (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(c.id)}
                                            aria-pressed={selected}
                                            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                                                selected
                                                    ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50'
                                                    : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={
                                                    branca
                                                        ? `h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-400 bg-white ${selected ? 'ring-2 ring-emerald-100 dark:ring-emerald-950' : ''}`
                                                        : `h-2.5 w-2.5 shrink-0 rounded-full ring-2 ${selected ? 'ring-emerald-100 dark:ring-emerald-950' : 'ring-zinc-100 dark:ring-zinc-800'} ${color.dot}`
                                                }
                                                aria-hidden
                                            />
                                            <span className="min-w-0 flex-1 truncate text-base font-semibold">
                                                {c.room_name}
                                            </span>
                                            {yours ? (
                                                <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                                    Sua classe
                                                </span>
                                            ) : null}
                                            {selected ? (
                                                <CheckIcon className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                                            ) : null}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={doCheckin}
                        className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950"
                    >
                        {submitting ? 'Salvando…' : 'Fazer check-in'}
                    </button>
                    {changing ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedId(checkin?.class_id ?? suggestedClassId);
                                setChanging(false);
                            }}
                            className="cursor-pointer py-2 text-sm font-semibold text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400"
                        >
                            Cancelar
                        </button>
                    ) : null}
                </div>
            </div>
        </MobileLayout>
    );
}
