import { homeFeatureCardMedia } from '@/data/homeFeatureCardMedia';
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

    const media = homeFeatureCardMedia.conheca;

    return (
        <section aria-label="Conheça a Nova Semente">
            <Link
                href={route('mobile.conheca')}
                className="group relative flex h-[7.25rem] cursor-pointer items-center overflow-hidden rounded-2xl border border-zinc-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:border-zinc-800 dark:bg-zinc-900 md:h-52 lg:h-64"
            >
                {media?.src ? (
                    <img
                        src={media.src}
                        alt=""
                        draggable={false}
                        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[46%] object-cover md:w-72 lg:w-[22rem]"
                        style={{ objectPosition: media.focus ?? 'center 42%' }}
                    />
                ) : null}
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-white from-[78%] to-transparent dark:from-zinc-900 md:w-[calc(100%-15rem)] lg:w-[calc(100%-18rem)]"
                    aria-hidden
                />
                <span className="relative z-10 flex w-[56%] min-w-0 items-center md:w-[calc(100%-19rem)] lg:w-[calc(100%-23rem)]">
                    <span className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                        <MapPinIcon className="h-4 w-4" aria-hidden strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1 px-3">
                        <span className="block text-[15px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                            Conheça a Nova Semente
                        </span>
                        <span className="mt-1 block line-clamp-2 text-[13px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                            Quem somos, pastores, localização e horários
                        </span>
                    </span>
                    <ChevronRightIcon
                        className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-brand-700 dark:text-zinc-500 dark:group-hover:text-brand-300"
                        aria-hidden
                        strokeWidth={1.75}
                    />
                </span>
            </Link>
        </section>
    );
}
