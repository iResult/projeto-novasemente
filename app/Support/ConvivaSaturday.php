<?php

namespace App\Support;

use Carbon\Carbon;

final class ConvivaSaturday
{
    public static function now(): Carbon
    {
        return Carbon::now(config('app.timezone'));
    }

    public static function todayDateString(): string
    {
        return self::now()->toDateString();
    }

    public static function isSaturday(?Carbon $moment = null): bool
    {
        return ($moment ?? self::now())->isSaturday();
    }

    /**
     * Sábado de culto, ou um dia extra combinado (treinamento).
     *
     * @return list<string>
     */
    public static function extraOpenDates(): array
    {
        return ['2026-10-02'];
    }

    public static function isCheckinOpen(?Carbon $moment = null): bool
    {
        $moment = ($moment ?? self::now())->copy();

        return $moment->isSaturday()
            || in_array($moment->toDateString(), self::extraOpenDates(), true);
    }

    /** Dia mostrado na presença: o sábado de referência, ou hoje se o check-in foi aberto fora do sábado. */
    public static function defaultPresenceDate(?Carbon $moment = null): string
    {
        $moment = $moment ?? self::now();
        if (self::isCheckinOpen($moment) && ! self::isSaturday($moment)) {
            return $moment->copy()->toDateString();
        }

        return self::referenceSaturdayString($moment);
    }

    /** Sábado de referência: hoje se for sábado; senão o sábado anterior. */
    public static function referenceSaturday(?Carbon $moment = null): Carbon
    {
        $day = ($moment ?? self::now())->copy()->startOfDay();
        if ($day->isSaturday()) {
            return $day;
        }

        return $day->previous(Carbon::SATURDAY);
    }

    public static function referenceSaturdayString(?Carbon $moment = null): string
    {
        return self::referenceSaturday($moment)->toDateString();
    }
}
