import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

type Props = {
    cardKey: string;
    bookmarked: boolean;
    disabled?: boolean;
    onToggle: (cardKey: string) => void;
    className?: string;
    labelAdd?: string;
    labelRemove?: string;
    /** `surface` é o botão sobre fundo claro. Os outros ficam sobre a fotografia. */
    tone?: 'surface' | 'on-dark' | 'on-light';
};

export default function HomeCardBookmarkButton({
    cardKey,
    bookmarked,
    disabled = false,
    onToggle,
    className = '',
    labelAdd = 'Marcar como favorito',
    labelRemove = 'Remover dos favoritos',
    tone = 'surface',
}: Props) {
    const label = bookmarked ? labelRemove : labelAdd;
    const toneClass =
        tone === 'on-dark'
            ? 'text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] hover:bg-white/15 hover:text-white'
            : tone === 'on-light'
              ? 'text-zinc-900 hover:bg-black/5 hover:text-zinc-950'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100';

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) {
                    onToggle(cardKey);
                }
            }}
            className={`absolute right-2 top-2 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${className}`}
            aria-label={label}
            aria-pressed={bookmarked}
            title={label}
        >
            {bookmarked ? (
                <HeartSolidIcon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden />
            ) : (
                <HeartOutlineIcon className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
            )}
        </button>
    );
}
