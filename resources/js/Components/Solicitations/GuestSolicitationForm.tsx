import MobileLayout from '@/Layouts/MobileLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InputLabel from '@/Components/InputLabel';
import Textarea from '@/Components/Textarea';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import BackLink from '@/Components/BackLink';

interface Option {
    value: number;
    label: string;
}

type Props = {
    title: string;
    intro: string;
    storeUrl: string;
    pastorOptions: Option[];
};

export default function GuestSolicitationForm({ title, intro, storeUrl, pastorOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        message: '',
        preferred_date: '',
        assigned_pastor_id: '',
        guest_name: '',
        email: '',
        phone: '',
    });

    const contactReady =
        data.guest_name.trim().length >= 2 && data.email.trim() !== '' && data.phone.trim() !== '' && data.message.trim() !== '';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeUrl);
    };

    return (
        <MobileLayout>
            <Head title={title} />
            <div className="mx-auto w-full max-w-lg space-y-6 pb-4">
                <div>
                    <BackLink href={route('mobile.fale')} ariaLabel="Voltar para Fale com a Nova Semente" />
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{intro}</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <div>
                        <InputLabel htmlFor="guest_name" value="Nome ou apelido" />
                        <TextInput
                            id="guest_name"
                            value={data.guest_name}
                            onChange={(e) => setData('guest_name', e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            required
                        />
                        <InputError message={errors.guest_name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="guest_message" value="Mensagem" />
                        <Textarea
                            id="guest_message"
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            rows={6}
                            className="mt-1 block w-full"
                            placeholder="Escreva os detalhes do seu pedido…"
                            required
                        />
                        <InputError message={errors.message} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="guest_pref_date" value="Data pretendida (opcional)" />
                        <input
                            id="guest_pref_date"
                            type="date"
                            value={data.preferred_date}
                            onChange={(e) => setData('preferred_date', e.target.value)}
                            className="mt-1 block h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/20"
                        />
                        <InputError message={errors.preferred_date} className="mt-1" />
                    </div>
                    {pastorOptions.length > 0 ? (
                        <div>
                            <InputLabel htmlFor="guest_pastor" value="Pastor (opcional)" />
                            <SelectInput
                                id="guest_pastor"
                                className="mt-1"
                                value={data.assigned_pastor_id}
                                onChange={(e) => setData('assigned_pastor_id', e.target.value)}
                            >
                                <option value="">—</option>
                                {pastorOptions.map((option) => (
                                    <option key={option.value} value={String(option.value)}>
                                        {option.label}
                                    </option>
                                ))}
                            </SelectInput>
                            <InputError message={errors.assigned_pastor_id} className="mt-1" />
                        </div>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="guest_email" value="E-mail de contato" />
                            <TextInput
                                id="guest_email"
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
                            <InputLabel htmlFor="guest_phone" value="Telefone de contato" />
                            <TextInput
                                id="guest_phone"
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
                    <PrimaryButton type="submit" disabled={processing || !contactReady} className="w-full justify-center">
                        Enviar pedido
                    </PrimaryButton>
                </form>
            </div>
        </MobileLayout>
    );
}
