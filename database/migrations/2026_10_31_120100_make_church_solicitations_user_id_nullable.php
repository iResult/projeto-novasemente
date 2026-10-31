<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('church_solicitations') || ! Schema::hasColumn('church_solicitations', 'user_id')) {
            return;
        }

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('church_solicitations') || ! Schema::hasColumn('church_solicitations', 'user_id')) {
            return;
        }

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });

        Schema::table('church_solicitations', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
