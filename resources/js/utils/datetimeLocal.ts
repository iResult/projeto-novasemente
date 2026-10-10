/** Fuso da igreja. O input datetime-local não leva offset; o valor é o relógio de São Paulo. */
export const CHURCH_TIMEZONE = 'America/Sao_Paulo';

/** `2026-10-09T21:30` sem Z/offset: já é o relógio da igreja, não um instante UTC. */
const NAIVE_DATETIME = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2})?$/;

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

/** Aceita o ISO do Laravel com microssegundos (`...000000Z`), que o Safari rejeita. */
export function parseInstant(value: Date | string | null | undefined): Date | null {
    if (value == null || value === '') {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const normalized = value.trim().replace(/(\.\d{3})\d+/, '$1');
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Valor para `<input type="datetime-local">` no fuso da igreja.
 * Não usar `iso.slice(0, 16)`: o Laravel serializa Carbon em UTC (`...Z`) e esses 16 caracteres ficam 3 horas à frente.
 */
export function toDatetimeLocalInput(value: Date | string | null | undefined): string {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        const naive = trimmed.match(NAIVE_DATETIME);
        if (naive) {
            return naive[1];
        }
    }

    const date = parseInstant(value);
    if (!date) {
        return '';
    }

    const parts = churchDateParts(date);
    const hour = parts.hour === '24' ? '00' : parts.hour;

    return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

/** Data e hora no relógio da igreja, para lista e prévia. */
export function formatChurchDateTime(value: Date | string | null | undefined): string {
    if (typeof value === 'string') {
        const naive = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/);
        if (naive) {
            return `${naive[3]}/${naive[2]}/${naive[1]}, ${naive[4]}:${naive[5]}`;
        }
    }

    const date = parseInstant(value);
    if (!date) {
        return '';
    }

    return date.toLocaleString('pt-BR', {
        timeZone: CHURCH_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
