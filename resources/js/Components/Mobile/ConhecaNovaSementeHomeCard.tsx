import HomeFeatureCard from '@/Components/Mobile/HomeFeatureCard';
import { useAppFeatures } from '@/hooks/useAppFeatures';
import { MapPinIcon } from '@heroicons/react/24/outline';

const HUB_FEATURE_KEYS = ['quem_somos', 'pastors', 'location', 'services', 'beliefs', 'acompanhar_culto'] as const;

export default function ConhecaNovaSementeHomeCard() {
    const { isEnabled } = useAppFeatures();
    const visible = HUB_FEATURE_KEYS.some((key) => isEnabled(key));

    if (!visible) {
        return null;
    }

    return (
        <section aria-label="Conheça a Nova Semente">
            <HomeFeatureCard
                mediaId="conheca"
                title="Conheça a Nova Semente"
                subtitle="Quem somos, pastores, localização e horários"
                icon={MapPinIcon}
                href={route('mobile.conheca')}
            />
        </section>
    );
}
