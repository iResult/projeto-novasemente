import { Link } from '@inertiajs/react';
import { EyeIcon } from '@heroicons/react/24/outline';
import type { NsTimerFollowHomeCard as FollowCard } from '@/utils/nsTimerFollow';

type Props = {
    follow: FollowCard;
};

function stageCountLabel(count: number): string {
    return count === 1 ? '1 etapa' : `${count} etapas`;
}

export default function NsTimerFollowHomeCard({ follow }: Props) {
    const detail = follow.live
        ? follow.current_stage_name || 'Culto em andamento'
        : [follow.start_time, stageCountLabel(follow.stage_count)].filter(Boolean).join(' · ');

    return (
        <section aria-label="Acompanhar culto">
            <Link
                href={route('mobile.acompanhar-culto')}
                className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-zinc-200/90 transition hover:bg-zinc-50 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 dark:bg-teal-950/45 dark:text-teal-200">
                    <EyeIcon className="h-6 w-6" aria-hidden strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-800 dark:text-teal-200">
                        {follow.live ? 'Ao vivo' : follow.status_label}
                    </p>
                    <p className="mt-0.5 truncate text-[15px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
                        {follow.title}
                    </p>
                    <p className="mt-1 truncate text-[12px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                        {detail || 'Acompanhar as etapas do culto'}
                    </p>
                </div>
            </Link>
        </section>
    );
}
