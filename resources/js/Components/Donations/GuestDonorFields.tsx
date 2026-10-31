import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

interface Props {
    name: string;
    phone: string;
    nameError?: string;
    phoneError?: string;
    onName: (value: string) => void;
    onPhone: (value: string) => void;
}

export default function GuestDonorFields({ name, phone, nameError, phoneError, onName, onPhone }: Props) {
    return (
        <div className="space-y-3">
            <div>
                <InputLabel htmlFor="guest_donor_name" value="Seu nome" />
                <TextInput
                    id="guest_donor_name"
                    value={name}
                    onChange={(e) => onName(e.target.value)}
                    className="mt-1 w-full"
                    autoComplete="name"
                    required
                />
                <InputError message={nameError} className="mt-1" />
            </div>
            <div>
                <InputLabel htmlFor="guest_donor_phone" value="Telefone" />
                <TextInput
                    id="guest_donor_phone"
                    value={phone}
                    onChange={(e) => onPhone(e.target.value)}
                    className="mt-1 w-full"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                />
                <InputError message={phoneError} className="mt-1" />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                A equipe usa esses dados só para conferir. O histórico pessoal continua na conta de quem entra no app.
            </p>
        </div>
    );
}
