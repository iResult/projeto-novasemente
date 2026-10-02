<?php

namespace App\Http\Requests;

use App\Models\Church;
use App\Support\ConvivaColors;
use Illuminate\Foundation\Http\FormRequest;

class StoreConvivaClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('conviva.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        }
    }

    public function rules(): array
    {
        $churchId = Church::resolveWorkingId($this);

        return [
            'room_name' => ConvivaColors::nameRules($churchId),
            'teacher_name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_name.required' => 'Escolha a cor da turma.',
            'room_name.in' => 'Escolha uma das cores disponíveis.',
            'room_name.unique' => 'Já existe uma turma com essa cor.',
        ];
    }
}
