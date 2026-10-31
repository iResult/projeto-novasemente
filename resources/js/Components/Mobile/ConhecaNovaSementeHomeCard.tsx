import { useAppFeatures } from '@/hooks/useAppFeatures';
import { Link } from '@inertiajs/react';
import { ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';

const HUB_FEATURE_KEYS = ['quem_somos', 'pastors', 'location', 'services', 'beliefs', 'acompanhar_culto'] as const;

export default function ConhecaNovaSementeHomeCard() {
    const { isEnabled } = useAppFeatures();
    const visible = HUB_FEATURE_KEYS.some((key) => isEnabled(key));

    if (!visible) {
        return null;
    }

    return (
        <section aria-label="Conheça a Nova Semente" className="min-w-0">
            <Link
                href={route('mobile.conheca')}
                className="group flex h-full min-h-[8.75rem] cursor-pointer flex-col gap-2.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:border-zinc-800 dark:bg-zinc-900 md:min-h-[7.25rem] md:flex-row md:items-center md:gap-3 md:px-4"
            >
                <span className="flex items-center justify-between md:contents">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 ring-1 ring-zinc-200/90 dark:bg-zinc-800 dark:text-brand-200 dark:ring-zinc-700 md:order-1 md:h-11 md:w-11">
                        <MapPinIcon className="h-5 w-5" aria-hidden strokeWidth={1.6} />
                    </span>
                    <ChevronRightIcon
                        className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-brand-700 dark:text-zinc-500 dark:group-hover:text-brand-300 md:order-3"
                        aria-hidden
                        strokeWidth={1.75}
                    />
                </span>
                <span className="min-w-0 md:order-2 md:flex-1">
                    <span className="block text-[13px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 md:text-[15px]">
                        Conheça a Nova Semente
                    </span>
                    <span className="mt-1 line-clamp-3 text-[12px] font-medium leading-snug text-zinc-600 dark:text-zinc-300 md:text-[13px]">
                        Quem somos, pastores e horários
                    </span>
                </span>
            </Link>
        </section>
    );
}
