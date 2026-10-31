<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_bible_verse_marks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('book_key', 24);
            $table->unsignedSmallInteger('chapter');
            $table->unsignedSmallInteger('verse');
            $table->timestamps();

            $table->unique(['user_id', 'book_key', 'chapter', 'verse']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_bible_verse_marks');
    }
};
