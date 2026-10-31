<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class VidaSaudeArticle extends Model
{
    protected $fillable = [
        'wix_post_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'author_name',
        'source_url',
        'image_url',
        'primary_category_id',
        'is_active',
        'feed_priority',
        'published_at',
        'source_modified_at',
        'feed_released_at',
        'synced_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'feed_priority' => 'boolean',
        'published_at' => 'datetime',
        'source_modified_at' => 'datetime',
        'feed_released_at' => 'datetime',
        'synced_at' => 'datetime',
    ];

    public function primaryCategory(): BelongsTo
    {
        return $this->belongsTo(VidaSaudeCategory::class, 'primary_category_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(VidaSaudeCategory::class, 'vida_saude_article_category')
            ->orderBy('display_position')
            ->orderBy('label');
    }

    public function sectionLabel(): string
    {
        return $this->primaryCategory?->label ?? 'Vida e Saúde';
    }

    public function sectionSlug(): ?string
    {
        return $this->primaryCategory?->slug;
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeSearch($query, string $term)
    {
        $term = trim($term);
        if ($term === '') {
            return $query;
        }

        $like = '%'.$term.'%';

        return $query->where(function ($q) use ($like) {
            $q->where('title', 'like', $like)
                ->orWhere('excerpt', 'like', $like)
                ->orWhere('body', 'like', $like)
                ->orWhere('author_name', 'like', $like);
        });
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeVisibleInApp($query)
    {
        return $query
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }
}
