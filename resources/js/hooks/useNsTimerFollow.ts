import { useEffect, useState } from 'react';
import { fetchNsTimerFollow, type NsTimerFollow } from '@/utils/nsTimerFollow';

type Options = {
    initial: NsTimerFollow;
    pollUrl: string;
    pollMs?: number;
};

export function useNsTimerFollow({ initial, pollUrl, pollMs = 4000 }: Options): NsTimerFollow {
    const [follow, setFollow] = useState(initial);

    useEffect(() => {
        setFollow(initial);
    }, [initial]);

    useEffect(() => {
        if (!pollUrl) return;

        let cancelled = false;
        const tick = async () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            const next = await fetchNsTimerFollow(pollUrl);
            if (cancelled || next == null) return;
            setFollow(next);
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
    }, [pollUrl, pollMs]);

    return follow;
}
