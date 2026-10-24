import type { SVGProps } from 'react';

/** Gota d'água no mesmo traço fino dos ícones outline da Home. */
export default function DropletIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={className}
            {...props}
        >
            <path d="M12 3.1c2.7 3.5 5.5 6.7 5.5 10a5.5 5.5 0 0 1-11 0c0-3.3 2.8-6.5 5.5-10Z" />
        </svg>
    );
}
