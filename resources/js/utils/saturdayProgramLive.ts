export type LiveScheduleRow = { kind: 'item' | 'section' };

export function nextLiveIndex(items: LiveScheduleRow[], fromIndex: number): number {
    for (let i = fromIndex + 1; i < items.length; i++) {
        if (items[i]?.kind === 'item') return i;
    }
    return items.length;
}

export function firstLiveIndex(items: LiveScheduleRow[]): number | null {
    const i = items.findIndex((row) => row.kind === 'item');
    return i >= 0 ? i : null;
}

/** Próximo cursor após toque no ✓ do item `tappedIndex`. */
export function computeToggleLiveIndex(
    items: LiveScheduleRow[],
    current: number | null,
    tappedIndex: number,
): number {
    if (current === null) {
        return tappedIndex;
    }
    if (tappedIndex < current) {
        return tappedIndex;
    }
    if (tappedIndex === current) {
        return nextLiveIndex(items, tappedIndex);
    }
    return tappedIndex;
}

export function isLiveFinished(items: LiveScheduleRow[], current: number | null): boolean {
    return current !== null && current >= items.length;
}

function csrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
        (window as unknown as { Laravel?: { csrfToken?: string } }).Laravel?.csrfToken ??
        ''
    );
}

export type SaturdayLiveState = {
    id?: number;
    status?: string;
    live_current_index: number | null;
    live_updated_at?: string | null;
    live_active?: boolean;
};

export async function fetchSaturdayProgramLive(url: string): Promise<SaturdayLiveState | null> {
    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as SaturdayLiveState;
        return {
            ...data,
            live_current_index:
                typeof data.live_current_index === 'number' ? data.live_current_index : null,
        };
    } catch {
        return null;
    }
}

export async function patchSaturdayProgramLive(
    url: string,
    liveCurrentIndex: number | null,
): Promise<SaturdayLiveState | null> {
    try {
        const res = await fetch(url, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ live_current_index: liveCurrentIndex }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as SaturdayLiveState;
        return {
            ...data,
            live_current_index:
                typeof data.live_current_index === 'number' ? data.live_current_index : null,
        };
    } catch {
        return null;
    }
}
