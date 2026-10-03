<?php

namespace Database\Seeders;

use App\Models\Church;
use App\Models\ConvivaClass;
use Illuminate\Database\Seeder;

class ConvivaClassSeeder extends Seeder
{
    public function run(): void
    {
        $churchId = Church::query()->where('active', true)->orderBy('id')->value('id')
            ?? Church::query()->orderBy('id')->value('id');

        if (! $churchId) {
            return;
        }

        if (ConvivaClass::query()->where('church_id', $churchId)->exists()) {
            return;
        }

        $examples = [
            ['room_name' => 'Riva', 'teacher_name' => 'Alencar', 'sort_order' => 1],
            ['room_name' => 'Fernando', 'teacher_name' => 'Arruda', 'sort_order' => 2],
            ['room_name' => 'Geferson', 'teacher_name' => 'Arantes', 'sort_order' => 3],
            ['room_name' => 'Rogério', 'teacher_name' => 'Ferreira', 'sort_order' => 4],
            ['room_name' => 'Sandra', 'teacher_name' => 'Sabaté', 'sort_order' => 5],
            ['room_name' => 'Inflexão', 'teacher_name' => 'Wesley Moura', 'sort_order' => 6],
            ['room_name' => 'Visitantes', 'teacher_name' => 'Márcio Desenzi', 'sort_order' => 7],
            ['room_name' => 'Backstage', 'teacher_name' => 'Alexandre Romano', 'sort_order' => 8],
            ['room_name' => 'Pais', 'teacher_name' => 'Antonio e Aída', 'sort_order' => 9],
            ['room_name' => 'Jovens', 'teacher_name' => '', 'sort_order' => 10],
        ];

        foreach ($examples as $row) {
            ConvivaClass::create([
                'church_id' => $churchId,
                'room_name' => $row['room_name'],
                'teacher_name' => $row['teacher_name'],
                'is_active' => true,
                'sort_order' => $row['sort_order'],
            ]);
        }
    }
}
