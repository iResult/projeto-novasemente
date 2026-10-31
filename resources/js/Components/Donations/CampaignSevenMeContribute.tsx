import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const SEVENME_LOGO_SRC = '/images/7me-logo.png';

export type CampaignSevenMeTone = 'brand' | 'emerald' | 'neutral';

/**
 * Tinta do «7» (#1B3665), aprofundada. O «me» cinza fica na placa clara,
 * senão some no fundo escuro.
 */
const sevenMeInk = {
    card: 'border-[#1B3665]/30 bg-[linear-gradient(180deg,#1A3A6B_0%,#102444_42%,#0E2140_100%)] shadow-[0_10px_22px_-14px_rgba(10,24,48,0.85)] ring-[#163056]/80 hover:bg-[linear-gradient(180deg,#21467C_0%,#163056_46%,#122848_100%)] hover:shadow-[0_14px_26px_-14px_rgba(10,24,48,0.8)] dark:border-[#2A4A78]/70 dark:bg-[linear-gradient(180deg,#1B3E72_0%,#0E2244_46%,#0C1C38_100%)] dark:ring-[#2A4A78]/45 dark:hover:bg-[linear-gradient(180deg,#24508A_0%,#163056_48%,#102444_100%)]',
    iconWrap: 'bg-[#F7F8FA] shadow-[0_1px_2px_rgba(8,18,36,0.28)] ring-1 ring-white/80',
    title: 'text-white',
    subtitle: 'text-[#C5D0DE]',
    chevron: 'text-[#8EA4C4] group-hover:text-white',
};

const toneClasses: Record<
    CampaignSevenMeTone,
    {
        card: string;
        iconWrap: string;
        title: string;
        subtitle: string;
        chevron: string;
    }
> = {
    brand: sevenMeInk,
    emerald: sevenMeInk,
    neutral: sevenMeInk,
};

type Props = {
    href: string;
    title?: string;
    subtitle?: string;
    tone?: CampaignSevenMeTone;
    className?: string;
};

export default function CampaignSevenMeContribute({
    href,
    title = 'Contribuir via 7me',
    subtitle = 'Abre o link oficial de doação',
    tone = 'neutral',
    className = '',
}: Props) {
    const styles = toneClasses[tone];

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ring-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3665] active:scale-[0.99] sm:rounded-3xl sm:p-5 ${styles.card} ${className}`}
        >
            <span className={`flex h-12 w-16 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
                <img
                    src={SEVENME_LOGO_SRC}
                    alt=""
                    className="h-6 w-auto object-contain"
                    width={46}
                    height={24}
                />
            </span>
            <span className="min-w-0 flex-1">
                <span className={`block text-base font-semibold sm:text-lg ${styles.title}`}>{title}</span>
                <span className={`mt-0.5 block text-xs ${styles.subtitle}`}>{subtitle}</span>
            </span>
            <ArrowTopRightOnSquareIcon
                className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${styles.chevron}`}
                aria-hidden
            />
        </a>
    );
}
