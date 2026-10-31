import MobileLayout from '@/Layouts/MobileLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SelectInput from '@/Components/SelectInput';
import TextInput from '@/Components/TextInput';
import type { PastoralPastorOpt } from '@/Components/PastoralAppointment/PastoralAppointmentForm';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import BackLink from '@/Components/BackLink';

interface Props {
    pastors: PastoralPastorOpt[];
    storeUrl: string;
}

export default function GuestPastoralRequest({ pastors, storeUrl }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        guest_name: '',
        email: '',
        phone: '',
        assigned_pastor_id: '',
        preferred_start: '',
        preferred_modality: '' as '' | 'presential' | 'online',
        subject: '',
        notes: '',
    });

    const selectedPastor = useMemo(() => {
        const pastorId = data.assigned_pastor_id === '' ? null : Number(data.assigned_pastor_id);
        if (pastorId === null || Number.isNaN(pastorId)) {
            return null;
        }

        return pastors.find((pastor) => pastor.id === pastorId) ?? null;
    }, [pastors, data.assigned_pastor_id]);

    const selectedSlot = useMemo(() => {
        if (!selectedPastor || !data.preferred_start) {
            return null;
        }

        return selectedPastor.slots.find((slot) => slot.value === data.preferred_start) ?? null;
    }, [selectedPastor, data.preferred_start]);

    const modalityReady = selectedSlot?.modality !== 'both' || data.preferred_modality === 'presential' || data.preferred_modality === 'online';
    const contactReady = data.guest_name.trim().length >= 2 && data.email.trim() !== '' && data.phone.trim() !== '';
    const canSubmit = Boolean(selectedPastor && selectedSlot && modalityReady && contactReady);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeUrl);
    };

    return (
        <MobileLayout>
            <Head title="Agenda com o Pastor" />
            <div className="mx-auto w-full max-w-lg space-y-6 pb-4">
                <div>
                    <BackLink href={route('mobile.fale')} ariaLabel="Voltar para Fale com a Nova Semente" />
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                        Agenda com o Pastor
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Escolha um pastor e um horário livre. A igreja confirma pelo e-mail ou telefone, mesmo sem conta no app.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <div>
                        <InputLabel htmlFor="pastor_guest_name" value="Nome ou apelido" />
                        <TextInput
                            id="pastor_guest_name"
                            value={data.guest_name}
                            onChange={(e) => setData('guest_name', e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            required
                        />
                        <InputError message={errors.guest_name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="pastor_guest_pastor" value="Pastor" />
                        <SelectInput
                            id="pastor_guest_pastor"
                            className="mt-1"
                            value={data.assigned_pastor_id}
                            onChange={(e) => {
                                setData('assigned_pastor_id', e.target.value);
                                setData('preferred_start', '');
                                setData('preferred_modality', '');
                            }}
                            required
                        >
                            <option value="" disabled>
                                Selecione…
                            </option>
                            {pastors.map((pastor) => (
                                <option key={pastor.id} value={pastor.id}>
                                    {pastor.name}
                                </option>
                            ))}
                        </SelectInput>
                        <InputError message={errors.assigned_pastor_id} className="mt-1" />
                        {pastors.length === 0 ? (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                Ainda não há pastores cadastrados. Entre em contato com a secretaria.
                            </p>
                        ) : null}
                    </div>
                    {selectedPastor ? (
                        <div>
                            <InputLabel value="Horário" />
                            {selectedPastor.slots.length > 0 ? (
                                <ul className="mt-2 space-y-2" role="radiogroup" aria-label="Horários disponíveis">
                                    {selectedPastor.slots.map((slot) => (
                                        <li key={slot.value}>
                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:has-[:checked]:border-primary-600 dark:has-[:checked]:bg-primary-950/30">
                                                <input
                                                    type="radio"
                                                    name="preferred_start_slot"
                                                    className="mt-1 cursor-pointer"
                                                    value={slot.value}
                                                    checked={data.preferred_start === slot.value}
                                                    onChange={() => {
                                                        setData('preferred_start', slot.value);
                                                        setData('preferred_modality', '');
                                                    }}
                                                />
                                                <span className="text-sm text-zinc-800 dark:text-zinc-200">{slot.label}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    No momento, os horários deste pastor estão todos preenchidos. Tente novamente mais tarde.
                                </p>
                            )}
                            {selectedSlot?.modality === 'both' ? (
                                <div className="mt-4 space-y-2">
                                    <InputLabel value="Modalidade" />
                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 has-[:checked]:border-primary-500 dark:border-zinc-700 dark:has-[:checked]:border-primary-600">
                                        <input
                                            type="radio"
                                            name="preferred_modality"
                                            className="cursor-pointer"
                                            value="presential"
                                            checked={data.preferred_modality === 'presential'}
                                            onChange={() => setData('preferred_modality', 'presential')}
                                        />
                                        <span className="text-sm text-zinc-800 dark:text-zinc-200">Presencial (na igreja)</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 has-[:checked]:border-primary-500 dark:border-zinc-700 dark:has-[:checked]:border-primary-600">
                                        <input
                                            type="radio"
                                            name="preferred_modality"
                                            className="cursor-pointer"
                                            value="online"
                                            checked={data.preferred_modality === 'online'}
                                            onChange={() => setData('preferred_modality', 'online')}
                                        />
                                        <span className="text-sm text-zinc-800 dark:text-zinc-200">Online (videoconferência)</span>
                                    </label>
                                    <InputError message={errors.preferred_modality} className="mt-1" />
                                </div>
                            ) : null}
                            <InputError message={errors.preferred_start} className="mt-2" />
                        </div>
                    ) : null}
                    <div>
                        <InputLabel htmlFor="pastor_guest_subject" value="Assunto (opcional)" />
                        <TextInput
                            id="pastor_guest_subject"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.subject} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="pastor_guest_notes" value="O que gostaria de tratar? (opcional)" />
                        <textarea
                            id="pastor_guest_notes"
                            className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            rows={4}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="pastor_guest_email" value="E-mail de contato" />
                            <TextInput
                                id="pastor_guest_email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 block w-full"
                                autoComplete="email"
                                required
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="pastor_guest_phone" value="Telefone de contato" />
                            <TextInput
                                id="pastor_guest_phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1 block w-full"
                                autoComplete="tel"
                                placeholder="(11) 99999-9999"
                                required
                            />
                            <InputError message={errors.phone} className="mt-1" />
                        </div>
                    </div>
                    <PrimaryButton type="submit" disabled={processing || !canSubmit} className="w-full justify-center">
                        Enviar pedido
                    </PrimaryButton>
                </form>
            </div>
        </MobileLayout>
    );
}
