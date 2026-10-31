<?php

namespace App\Support;

class GuestContact
{
    /**
     * @return array<string, list<string>>
     */
    public static function rules(bool $required): array
    {
        return [
            'guest_name' => $required
                ? ['required', 'string', 'min:2', 'max:80']
                : ['nullable', 'string', 'max:80'],
            'guest_phone' => $required
                ? ['required', 'string', 'min:8', 'max:30']
                : ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'guest_name.required' => 'Informe seu nome.',
            'guest_name.min' => 'Use pelo menos 2 letras no nome.',
            'guest_phone.required' => 'Informe um telefone para a equipe entrar em contato.',
            'guest_phone.min' => 'Informe um telefone com pelo menos 8 dígitos.',
        ];
    }

    public static function phoneNote(?string $phone): ?string
    {
        $phone = trim((string) $phone);

        return $phone === '' ? null : 'Telefone do visitante: '.$phone;
    }
}
