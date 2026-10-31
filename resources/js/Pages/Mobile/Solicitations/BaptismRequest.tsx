import GuestSolicitationForm from '@/Components/Solicitations/GuestSolicitationForm';

interface Option {
    value: number;
    label: string;
}

interface Props {
    storeUrl: string;
    pastorOptions: Option[];
}

export default function BaptismRequest({ storeUrl, pastorOptions }: Props) {
    return (
        <GuestSolicitationForm
            title="Pedido de Batismo"
            intro="Conte um pouco da sua história. A igreja entra em contato pelo e-mail ou telefone, mesmo sem conta no app."
            storeUrl={storeUrl}
            pastorOptions={pastorOptions}
        />
    );
}
