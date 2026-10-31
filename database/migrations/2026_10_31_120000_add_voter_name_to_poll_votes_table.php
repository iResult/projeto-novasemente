<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('poll_votes') || Schema::hasColumn('poll_votes', 'voter_name')) {
            return;
        }

        Schema::table('poll_votes', function (Blueprint $table) {
            $table->string('voter_name', 80)->nullable()->after('answer_text');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('poll_votes') || ! Schema::hasColumn('poll_votes', 'voter_name')) {
            return;
        }

        Schema::table('poll_votes', function (Blueprint $table) {
            $table->dropColumn('voter_name');
        });
    }
};
