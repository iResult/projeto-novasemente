<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saturday_programs', function (Blueprint $table) {
            $table->unsignedInteger('live_current_index')->nullable()->after('parse_error');
            $table->timestamp('live_updated_at')->nullable()->after('live_current_index');
        });
    }

    public function down(): void
    {
        Schema::table('saturday_programs', function (Blueprint $table) {
            $table->dropColumn(['live_current_index', 'live_updated_at']);
        });
    }
};
