import BackLink from '@/Components/BackLink';

export default function MissionHubBackLink() {
    return (
        <BackLink href={route('mobile.mission')} ariaLabel="Voltar para Missão" />
    );
}
