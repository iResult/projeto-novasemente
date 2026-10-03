import MobileLayout from '@/Layouts/MobileLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

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

const classDots: Record<string, string> = {
    'Riva Alencar': 'bg-blue-600',
    'Fernando Arruda': 'bg-emerald-600',
    'Geferson Arantes': 'bg-amber-500',
    'Rogério Ferreira': 'bg-violet-500',
    'Sandra Sabaté': 'bg-rose-500',
    'Inflexão - Wesley Moura': 'bg-teal-600',
    'Visitantes - Márcio Desenzi': 'bg-sky-600',
    'Backstage - Alexandre Romano': 'bg-zinc-700 dark:bg-zinc-300',
    'Pais - Antonio/Aída': 'bg-orange-500',
    Jovens: 'bg-indigo-500',
};

const fallbackDots = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-600'];

function classDot(name: string | null | undefined): string {
    const label = name?.trim() ?? '';
    if (label !== '' && classDots[label]) {
        return classDots[label];
    }

    let hash = 0;
    for (let i = 0; i < label.length; i += 1) {
        hash = (hash + label.charCodeAt(i)) % fallbackDots.length;
    }

    return fallbackDots[hash] ?? fallbackDots[0];
}

function ClassDot({ name, large = false }: { name: string | null | undefined; large?: boolean }) {
    return (
        <span
            className={`shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900 ${large ? 'mt-2 h-3.5 w-3.5' : 'h-3 w-3'} ${classDot(name)}`}
            aria-hidden
        />
    );
}

function Header({ todayLabel, showDate = true }: { todayLabel: string; showDate?: boolean }) {
    return (
        <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
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
        return (
            <MobileLayout>
                <Head title="CONVIVA" />
                <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 text-center">
                    <Header todayLabel={todayLabel} showDate={false} />

                    <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                        <CheckIcon className="h-10 w-10" />
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                        Check-in realizado!
                    </h2>

                    <div className="w-full rounded-3xl bg-white px-6 pb-6 pt-7 text-left shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                        <div className="flex items-start gap-3">
                            <ClassDot name={checkin.room_name} large />
                            <p className="min-w-0 text-3xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-white">
                                {checkin.room_name}
                            </p>
                        </div>
                        <p className="mt-3 text-base font-medium text-zinc-500 dark:text-zinc-400">{firstName}</p>
                        <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{todayLabel}</p>
                            {checkin.checked_in_at ? (
                                <p className="shrink-0 text-lg font-medium tabular-nums leading-none text-zinc-950 dark:text-white">
                                    {checkin.checked_in_at}
                                </p>
                            ) : null}
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
                                className="cursor-pointer text-sm font-semibold text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-white dark:focus-visible:ring-white"
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
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            <CalendarDaysIcon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-100">
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

                                return (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(c.id)}
                                            aria-pressed={selected}
                                            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-zinc-200 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:bg-zinc-900 dark:ring-zinc-700 dark:focus-visible:ring-white ${
                                                selected
                                                    ? 'ring-2 ring-zinc-950 dark:ring-white'
                                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <ClassDot name={c.room_name} />
                                            <span className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                                                {c.room_name}
                                            </span>
                                            {yours ? (
                                                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 ring-1 ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-600">
                                                    Sua classe
                                                </span>
                                            ) : null}
                                            {selected ? (
                                                <CheckIcon className="h-5 w-5 shrink-0 text-zinc-950 dark:text-white" />
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
