import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fetchSaturdayProgramLive,
    patchSaturdayProgramLive,
} from '@/utils/saturdayProgramLive';

type Options = {
    programId: number | null;
    initialIndex: number | null;
    pollUrl: string | null;
    updateUrl: string | null;
    pollMs?: number;
};

export function useSaturdayProgramLive({
    programId,
    initialIndex,
    pollUrl,
    updateUrl,
    pollMs = 4000,
}: Options) {
    const [liveCurrentIndex, setLiveCurrentIndex] = useState<number | null>(initialIndex);
    const [pending, setPending] = useState(false);
    const pendingRef = useRef(false);

    useEffect(() => {
        setLiveCurrentIndex(initialIndex);
    }, [programId, initialIndex]);

    useEffect(() => {
        pendingRef.current = pending;
    }, [pending]);

    useEffect(() => {
        if (!pollUrl || programId == null) return;

        let cancelled = false;
        const tick = async () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            if (pendingRef.current) return;
            const next = await fetchSaturdayProgramLive(pollUrl);
            if (cancelled || next == null) return;
            if (typeof next.id === 'number' && next.id !== programId) return;
            setLiveCurrentIndex(next.live_current_index);
        };

        const id = window.setInterval(() => {
            void tick();
        }, pollMs);
        void tick();

        const onVisible = () => {
            if (document.visibilityState === 'visible') void tick();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [pollUrl, programId, pollMs]);

    const pushIndex = useCallback(
        async (nextIndex: number | null) => {
            if (!updateUrl || programId == null || pendingRef.current) return;
            const prev = liveCurrentIndex;
            setLiveCurrentIndex(nextIndex);
            setPending(true);
            const saved = await patchSaturdayProgramLive(updateUrl, nextIndex);
            if (saved == null) {
                setLiveCurrentIndex(prev);
            } else {
                setLiveCurrentIndex(saved.live_current_index);
            }
            setPending(false);
        },
        [liveCurrentIndex, programId, updateUrl],
    );

    return { liveCurrentIndex, pending, pushIndex };
}
