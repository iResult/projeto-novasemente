export type ConvivaColor = {
    name: string;
    plate: string;
    label: string;
    selectedRing: string;
    hoverRing: string;
    badge: string;
    mark: string;
};

export const convivaColors: ConvivaColor[] = [
    {
        name: 'Azul',
        plate: 'bg-blue-700',
        label: 'text-white',
        selectedRing: 'ring-blue-700 dark:ring-blue-300',
        hoverRing: 'hover:ring-blue-400 dark:hover:ring-blue-400',
        badge: 'bg-blue-50 text-blue-950 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-800',
        mark: 'text-blue-700',
    },
    {
        name: 'Verde',
        plate: 'bg-green-700',
        label: 'text-white',
        selectedRing: 'ring-green-700 dark:ring-green-300',
        hoverRing: 'hover:ring-green-400 dark:hover:ring-green-400',
        badge: 'bg-green-50 text-green-950 ring-green-200 dark:bg-green-950 dark:text-green-100 dark:ring-green-800',
        mark: 'text-green-800',
    },
    {
        name: 'Amarelo',
        plate: 'bg-yellow-400 border border-yellow-600 dark:bg-yellow-400 dark:border-yellow-500',
        label: 'text-yellow-950',
        selectedRing: 'ring-yellow-600 dark:ring-yellow-300',
        hoverRing: 'hover:ring-yellow-500 dark:hover:ring-yellow-300',
        badge: 'bg-yellow-100 text-yellow-950 ring-yellow-400 dark:bg-yellow-400 dark:text-yellow-950 dark:ring-yellow-500',
        mark: 'text-yellow-700',
    },
    {
        name: 'Branco',
        plate: 'bg-white border border-zinc-300 dark:bg-white dark:border-zinc-400',
        label: 'text-zinc-900',
        selectedRing: 'ring-zinc-500 dark:ring-white',
        hoverRing: 'hover:ring-zinc-400 dark:hover:ring-zinc-300',
        badge: 'bg-white text-zinc-900 ring-zinc-300 dark:bg-white dark:text-zinc-900 dark:ring-zinc-400',
        mark: 'text-zinc-800',
    },
    {
        name: 'Laranja',
        plate: 'bg-orange-500 dark:bg-orange-500',
        label: 'text-orange-950',
        selectedRing: 'ring-orange-600 dark:ring-orange-300',
        hoverRing: 'hover:ring-orange-400 dark:hover:ring-orange-300',
        badge: 'bg-orange-100 text-orange-950 ring-orange-300 dark:bg-orange-500 dark:text-orange-950 dark:ring-orange-400',
        mark: 'text-orange-700',
    },
];

const fallbackColor: ConvivaColor = {
    name: '',
    plate: 'bg-zinc-700',
    label: 'text-white',
    selectedRing: 'ring-zinc-500',
    hoverRing: 'hover:ring-zinc-400',
    badge: 'bg-zinc-100 text-zinc-900 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600',
    mark: 'text-zinc-700',
};

export function convivaColorFor(name: string | null | undefined): ConvivaColor {
    return convivaColors.find((color) => color.name === name) ?? { ...fallbackColor, name: name ?? '' };
}
