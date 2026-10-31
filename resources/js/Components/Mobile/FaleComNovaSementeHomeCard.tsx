import { useAppFeatures } from '@/hooks/useAppFeatures';
import { Link } from '@inertiajs/react';
import { ChatBubbleOvalLeftEllipsisIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function FaleComNovaSementeHomeCard({ pendingCount = 0 }: { pendingCount?: number }) {
    const { isEnabled } = useAppFeatures();

    if (!isEnabled('fale_com')) {
        return null;
    }

    const pending = pendingCount > 0 ? pendingCount : null;

    return (
        <section aria-label="Fale com a Nova Semente" className="min-w-0">
            <Link
                href={route('mobile.fale')}
                className="group flex h-full min-h-[8.75rem] cursor-pointer flex-col gap-2.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 dark:border-zinc-800 dark:bg-zinc-900 md:min-h-[7.25rem] md:flex-row md:items-center md:gap-3 md:px-4"
            >
                <span className="flex items-center justify-between md:contents">
                    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 ring-1 ring-zinc-200/90 dark:bg-zinc-800 dark:text-brand-200 dark:ring-zinc-700 md:order-1 md:h-11 md:w-11">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" aria-hidden strokeWidth={1.6} />
                        {pending ? (
                            <span
                                className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white dark:ring-zinc-900"
                                title={`${pending} ${pending === 1 ? 'mensagem pendente' : 'mensagens pendentes'}`}
                                aria-label={`${pending} ${pending === 1 ? 'mensagem pendente de responder' : 'mensagens pendentes de responder'}`}
                            >
                                {pending > 99 ? '99+' : pending}
                            </span>
                        ) : null}
                    </span>
                    <ChevronRightIcon
                        className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-brand-700 dark:text-zinc-500 dark:group-hover:text-brand-300 md:order-3"
                        aria-hidden
                        strokeWidth={1.75}
                    />
                </span>
                <span className="min-w-0 md:order-2 md:flex-1">
                    <span className="block text-[13px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 md:text-[15px]">
                        Fale com a Nova Semente
                    </span>
                    <span className="mt-1 line-clamp-3 text-[12px] font-medium leading-snug text-zinc-600 dark:text-zinc-300 md:text-[13px]">
                        Batismo, bebê, pastor, estudo, voluntário e NS Conecta
                    </span>
                </span>
            </Link>
        </section>
    );
}
