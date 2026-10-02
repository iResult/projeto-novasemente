<?php

namespace App\Support;

use Illuminate\Validation\Rule;

final class ConvivaColors
{
    /**
     * Nome da turma, na ordem de exibição.
     *
     * @return list<string>
     */
    public static function names(): array
    {
        return ['Azul', 'Verde', 'Amarelo', 'Branco', 'Laranja'];
    }

    public static function sortOrder(string $name): int
    {
        $index = array_search($name, self::names(), true);

        return $index === false ? 0 : $index + 1;
    }

    public static function nameRules(?int $churchId, int|string|null $ignoreId = null): array
    {
        $unique = Rule::unique('conviva_classes', 'room_name');
        if ($ignoreId !== null && $ignoreId !== '') {
            $unique->ignore($ignoreId);
        }

        return [
            'required',
            Rule::in(self::names()),
            $unique->where(
                fn ($query) => $churchId !== null ? $query->where('church_id', $churchId) : $query
            ),
        ];
    }
}
