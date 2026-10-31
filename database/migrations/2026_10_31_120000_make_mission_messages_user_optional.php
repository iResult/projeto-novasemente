<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mission_messages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('mission_messages', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('guest_name', 80)->nullable()->after('user_id');
        });

        Schema::table('mission_messages', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('mission_messages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('guest_name');
        });

        Schema::table('mission_messages', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
