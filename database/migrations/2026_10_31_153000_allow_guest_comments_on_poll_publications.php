<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('publication_comments') || ! Schema::hasColumn('publication_comments', 'user_id')) {
            return;
        }

        Schema::table('publication_comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('publication_comments', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        Schema::table('publication_comments', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            if (! Schema::hasColumn('publication_comments', 'author_name')) {
                $table->string('author_name', 80)->nullable()->after('user_id');
            }
            if (! Schema::hasColumn('publication_comments', 'guest_key')) {
                $table->string('guest_key', 64)->nullable()->after('author_name');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('publication_comments') || ! Schema::hasColumn('publication_comments', 'user_id')) {
            return;
        }

        DB::table('publication_comments')->whereNull('user_id')->delete();

        Schema::table('publication_comments', function (Blueprint $table) {
            if (Schema::hasColumn('publication_comments', 'guest_key')) {
                $table->dropColumn('guest_key');
            }
            if (Schema::hasColumn('publication_comments', 'author_name')) {
                $table->dropColumn('author_name');
            }
            $table->dropForeign(['user_id']);
        });

        Schema::table('publication_comments', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
