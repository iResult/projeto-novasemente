<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('weekly_programs')) {
            return;
        }

        DB::table('weekly_programs')
            ->whereIn('title', ['DESPEDIDA DO SÁBADO', 'Despedida do sábado', 'Despedida do sabado'])
            ->update([
                'title' => 'PÔR DO SOL',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('weekly_programs')) {
            return;
        }

        DB::table('weekly_programs')
            ->where('title', 'PÔR DO SOL')
            ->update([
                'title' => 'DESPEDIDA DO SÁBADO',
                'updated_at' => now(),
            ]);
    }
};
