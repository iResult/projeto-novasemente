import { Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { MouseEventHandler } from 'react';

const textClassName =
    'inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

const iconClassName =
    'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100';

type BackLinkProps = {
    href?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    /** Texto visível. O padrão é «Voltar». */
    label?: string;
    /** Nome acessível quando o destino não cabe no rótulo. */
    ariaLabel?: string;
    /**
     * Só a seta, para faixas que já têm o título na mesma linha (NS Conecta).
     * Exige `ariaLabel`.
     */
    iconOnly?: boolean;
    className?: string;
};

/**
 * Volta de tela: seta + «Voltar», cinza, sem caixa.
 * Sem `href` e sem `onClick`, renderiza um texto estático (pré-visualização).
 */
export default function BackLink({
    href,
    onClick,
    label = 'Voltar',
    ariaLabel,
    iconOnly = false,
    className = '',
}: BackLinkProps) {
    const accessibleName = ariaLabel ?? (iconOnly ? 'Voltar' : undefined);
    const classes = `${iconOnly ? iconClassName : textClassName} ${className}`.trim();
    const content = (
        <>
            <ArrowLeftIcon className={iconOnly ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} aria-hidden />
            {iconOnly ? null : label}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={classes} aria-label={accessibleName}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes} aria-label={accessibleName}>
                {content}
            </button>
        );
    }

    return (
        <span className={classes} aria-hidden={iconOnly ? undefined : true}>
            {content}
        </span>
    );
}
