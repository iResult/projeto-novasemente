<?php

namespace App\Http\Requests;

use App\Models\Church;
use App\Models\ConvivaClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConvivaClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('conviva.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeClassNumber();

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        }
    }

    public function rules(): array
    {
        $churchId = Church::resolveWorkingId($this);
        $current = $this->route('convivaClass');
        $ignoreId = $current instanceof ConvivaClass ? $current->id : $current;

        return [
            'room_name' => [
                'required',
                'regex:/^[1-9][0-9]{0,3}$/',
                Rule::unique('conviva_classes', 'room_name')
                    ->ignore($ignoreId)
                    ->where(
                        fn ($query) => $churchId !== null ? $query->where('church_id', $churchId) : $query
                    ),
            ],
            'teacher_name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_name.required' => 'Informe o número da turma.',
            'room_name.regex' => 'Use só o número da turma, de 1 a 9999.',
            'room_name.unique' => 'Já existe uma turma com esse número.',
        ];
    }

    private function normalizeClassNumber(): void
    {
        $raw = trim((string) $this->input('room_name', ''));
        if (preg_match('/^[0-9]+$/', $raw) === 1) {
            $this->merge(['room_name' => (string) (int) $raw]);
        }
    }
}
