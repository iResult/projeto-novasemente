import GuestSolicitationForm from '@/Components/Solicitations/GuestSolicitationForm';

interface Option {
    value: number;
    label: string;
}

interface Props {
    title: string;
    intro: string;
    storeUrl: string;
    pastorOptions: Option[];
}

export default function GuestRequest({ title, intro, storeUrl, pastorOptions }: Props) {
    return <GuestSolicitationForm title={title} intro={intro} storeUrl={storeUrl} pastorOptions={pastorOptions} />;
}
