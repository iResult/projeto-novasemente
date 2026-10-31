<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vida_saude_categories', function (Blueprint $table) {
            $table->id();
            $table->string('wix_category_id', 64)->unique();
            $table->string('slug')->unique();
            $table->string('label');
            $table->unsignedInteger('display_position')->default(0);
            $table->unsignedInteger('post_count')->nullable();
            $table->timestamps();

            $table->index('display_position');
        });

        Schema::create('vida_saude_articles', function (Blueprint $table) {
            $table->id();
            $table->string('wix_post_id', 64)->unique();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->string('author_name')->nullable();
            $table->string('source_url', 512);
            $table->string('image_url', 512)->nullable();
            $table->foreignId('primary_category_id')->nullable()->constrained('vida_saude_categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->boolean('feed_priority')->default(false);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamp('source_modified_at')->nullable();
            $table->timestamp('feed_released_at')->nullable()->index();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index('is_active');
            $table->index('feed_priority');
        });

        Schema::create('vida_saude_article_category', function (Blueprint $table) {
            $table->foreignId('vida_saude_article_id')->constrained('vida_saude_articles')->cascadeOnDelete();
            $table->foreignId('vida_saude_category_id')->constrained('vida_saude_categories')->cascadeOnDelete();
            $table->primary(['vida_saude_article_id', 'vida_saude_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vida_saude_article_category');
        Schema::dropIfExists('vida_saude_articles');
        Schema::dropIfExists('vida_saude_categories');
    }
};
