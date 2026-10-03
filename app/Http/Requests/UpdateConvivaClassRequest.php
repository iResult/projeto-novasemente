<?php

namespace App\Http\Requests;

use App\Models\Church;
use App\Models\ConvivaClass;
use App\Support\ConvivaColors;
use Illuminate\Foundation\Http\FormRequest;

class UpdateConvivaClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('conviva.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'room_name' => trim((string) $this->input('room_name', '')),
            'teacher_name' => trim((string) $this->input('teacher_name', '')),
        ];

        if ($this->has('is_active')) {
            $merge['is_active'] = filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $churchId = Church::resolveWorkingId($this);
        $current = $this->route('convivaClass');
        $ignoreId = $current instanceof ConvivaClass ? $current->id : $current;

        return [
            'room_name' => ConvivaColors::nameRules($churchId, $ignoreId),
            'teacher_name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_name.required' => 'Informe o nome da classe.',
            'room_name.max' => 'O nome da classe deve ter no máximo 80 caracteres.',
            'room_name.unique' => 'Já existe uma classe com esse nome.',
        ];
    }
}
