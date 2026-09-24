import SaturdayProgramScheduleView, {
    type SaturdaySchedule,
} from '@/Components/Mobile/SaturdayProgramScheduleView';
import { useSaturdayProgramLive } from '@/hooks/useSaturdayProgramLive';

type Props = {
    programId: number;
    schedule: SaturdaySchedule;
    fallbackDateLabel?: string | null;
    canConduct?: boolean;
    initialLiveIndex?: number | null;
    pollUrl: string;
    updateUrl?: string | null;
};

export default function SaturdayProgramLiveSchedule({
    programId,
    schedule,
    fallbackDateLabel = null,
    canConduct = false,
    initialLiveIndex = null,
    pollUrl,
    updateUrl = null,
}: Props) {
    const { liveCurrentIndex, pending, pushIndex } = useSaturdayProgramLive({
        programId,
        initialIndex: initialLiveIndex,
        pollUrl,
        updateUrl: canConduct ? updateUrl : null,
    });

    return (
        <SaturdayProgramScheduleView
            schedule={schedule}
            fallbackDateLabel={fallbackDateLabel}
            canConduct={canConduct}
            liveCurrentIndex={liveCurrentIndex}
            livePending={pending}
            onLiveIndexChange={canConduct ? (next) => void pushIndex(next) : undefined}
        />
    );
}
