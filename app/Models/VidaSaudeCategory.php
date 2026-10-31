<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VidaSaudeCategory extends Model
{
    protected $fillable = [
        'wix_category_id',
        'slug',
        'label',
        'display_position',
        'post_count',
    ];

    protected $casts = [
        'display_position' => 'integer',
        'post_count' => 'integer',
    ];

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(VidaSaudeArticle::class, 'vida_saude_article_category');
    }

    public function primaryArticles(): HasMany
    {
        return $this->hasMany(VidaSaudeArticle::class, 'primary_category_id');
    }
}
