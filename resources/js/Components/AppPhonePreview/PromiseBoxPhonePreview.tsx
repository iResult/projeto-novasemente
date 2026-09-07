import AppPhonePreview from '@/Components/AppPhonePreview/AppPhonePreview';
import {
    ArrowPathIcon,
    HeartIcon,
    HomeIcon,
    ShareIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export type PromiseBoxPreviewItem = {
    ref: string;
    textPreview: string | null;
    categoria?: string | null;
};

type Props = {
    show: boolean;
    item: PromiseBoxPreviewItem | null;
    onClose: () => void;
};

/**
 * Pré-visualização da Caixa de Promessas no celular: sheet quase no rodapé
 * (como o modal real do app), não um card de feed.
 */
export default function PromiseBoxPhonePreview({ show, item, onClose }: Props) {
    const text = item?.textPreview?.trim() || 'O texto desta promessa ainda não está disponível.';
    const ref = item?.ref?.trim() || 'Referência';

    return (
        <AppPhonePreview
            show={show}
            onClose={onClose}
            heading="Pré-visualização no app"
            subheading="Como o membro vê a Caixa de Promessas"
            bodyClassName="!h-full !overflow-hidden !px-0 !pb-0 !pt-0"
        >
            {!item ? (
                <p className="px-3.5 py-10 text-center text-sm text-zinc-500">Nada para pré-visualizar.</p>
            ) : (
                <div className="relative flex h-full min-h-0 flex-col">
                    {/* Fundo: home simplificada (atrás do sheet) */}
                    <div className="pointer-events-none min-h-0 flex-1 px-3.5 pb-28 pt-2 opacity-40" aria-hidden>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Início</p>
                        <div className="mt-3 space-y-2">
                            <div className="h-16 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
                            <div className="h-10 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-14 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
                                <div className="h-14 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
                            </div>
                        </div>
                    </div>

                    {/* Barra inferior do app (atrás do sheet) */}
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-center justify-around border-t border-zinc-200/80 bg-white/90 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950/90"
                        aria-hidden
                    >
                        {[HomeIcon, SparklesIcon, HeartIcon].map((Icon, i) => (
                            <span
                                key={i}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                                    i === 1
                                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                                        : 'text-zinc-400 dark:text-zinc-500'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                        ))}
                    </div>

                    {/* Overlay escuro + sheet ancorado no rodapé */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/45">
                        <div className="max-h-[90%] overflow-y-auto overscroll-contain rounded-t-[1.35rem] border border-b-0 border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="relative overflow-hidden px-4 pb-1 pt-5">
                                <div
                                    className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-brand-400/15 blur-2xl dark:bg-brand-500/10"
                                    aria-hidden
                                />
                                <div className="relative flex items-start gap-2.5 pr-2">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/20 ring-1 ring-brand-600/20">
                                        <SparklesIcon className="h-4 w-4" aria-hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700/80 dark:text-brand-300/90">
                                            Para você hoje
                                        </p>
                                        <h2 className="mt-0.5 text-[15px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                                            Caixa de Promessas
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-5 pt-3">
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white to-brand-50/60 px-4 pb-4 pt-5 shadow-[0_12px_40px_-18px_rgba(0,141,54,0.35)] ring-1 ring-brand-900/6 dark:from-zinc-900 dark:via-zinc-900 dark:to-brand-950/45 dark:ring-white/6">
                                    <span
                                        className="pointer-events-none absolute left-3 top-1.5 select-none font-serif text-5xl leading-none text-brand-600/15 dark:text-brand-400/20"
                                        aria-hidden
                                    >
                                        “
                                    </span>

                                    <p className="relative text-[14px] font-medium leading-[1.6] tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
                                        {text}
                                    </p>

                                    <div className="relative mt-4 flex items-center gap-2.5">
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-600/25 to-transparent dark:via-brand-400/25" />
                                        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/85">
                                            {ref}
                                        </p>
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-600/25 to-transparent dark:via-brand-400/25" />
                                    </div>

                                    <div className="relative mt-4 grid grid-cols-2 gap-1.5">
                                        <span className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-2xl bg-white/90 px-2 py-2 text-[11px] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-700/80">
                                            <ShareIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            Compartilhar
                                        </span>
                                        <span className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-2xl bg-white/90 px-2 py-2 text-[11px] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-700/80">
                                            <HeartIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            Favoritar
                                        </span>
                                    </div>

                                    <span className="mt-1.5 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-2 py-2 text-[11px] font-semibold text-white shadow-md shadow-brand-600/25">
                                        <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                        Abrir outra promessa
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppPhonePreview>
    );
}
