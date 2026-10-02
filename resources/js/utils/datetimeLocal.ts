/** Fuso da igreja. O input datetime-local não leva offset; o valor é o relógio de São Paulo. */
export const CHURCH_TIMEZONE = 'America/Sao_Paulo';

function churchDateParts(date: Date): Record<string, string> {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: CHURCH_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

/**
 * Valor para `<input type="datetime-local">` no fuso da igreja.
 * Não usar `iso.slice(0, 16)`: o Laravel serializa Carbon em UTC (`...Z`) e esses 16 caracteres ficam 3 horas à frente.
 */
export function toDatetimeLocalInput(value: Date | string | null | undefined): string {
    if (value == null || value === '') {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const parts = churchDateParts(date);
    const hour = parts.hour === '24' ? '00' : parts.hour;

    return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}
