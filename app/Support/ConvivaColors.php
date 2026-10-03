<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

final class ConvivaColors
{
    /**
     * Nome curto da classe, único por igreja.
     *
     * @return list<string|Unique>
     */
    public static function nameRules(?int $churchId, int|string|null $ignoreId = null): array
    {
        $unique = Rule::unique('conviva_classes', 'room_name');
        if ($ignoreId !== null && $ignoreId !== '') {
            $unique->ignore($ignoreId);
        }

        return [
            'required',
            'string',
            'max:80',
            $unique->where(
                fn ($query) => $churchId !== null ? $query->where('church_id', $churchId) : $query
            ),
        ];
    }
}
