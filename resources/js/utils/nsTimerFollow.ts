export type NsTimerStageState = 'current' | 'done' | 'upcoming';

export type NsTimerStage = {
    id: number;
    name: string;
    start_time: string | null;
    duration_label: string | null;
    responsible: string | null;
    state: NsTimerStageState;
};

export type NsTimerSection = {
    title: string | null;
    stages: NsTimerStage[];
};

export type NsTimerTeamRow = {
    label: string;
    value: string;
};

export type NsTimerFollowAvailable = {
    available: true;
    live: boolean;
    title: string;
    status: string;
    status_label: string;
    date_label: string;
    start_time: string;
    stage_count: number;
    current_stage_name: string | null;
    team: NsTimerTeamRow[];
    sections: NsTimerSection[];
};

export type NsTimerFollow = { available: false } | NsTimerFollowAvailable;

export function isNsTimerFollowAvailable(follow: NsTimerFollow): follow is NsTimerFollowAvailable {
    return follow.available === true;
}

export async function fetchNsTimerFollow(url: string): Promise<NsTimerFollow | null> {
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
        const data = (await res.json()) as NsTimerFollow;
        if (data == null || typeof data.available !== 'boolean') return null;
        return data;
    } catch {
        return null;
    }
}
