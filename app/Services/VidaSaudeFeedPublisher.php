<?php

namespace App\Services;

use App\Models\VidaSaudeArticle;
use Illuminate\Support\Carbon;

class VidaSaudeFeedPublisher
{
    /**
     * Solta no máximo um artigo por dia: o mais novo que ainda não entrou no feed.
     */
    public function publishNext(?Carbon $now = null): ?VidaSaudeArticle
    {
        $timezone = (string) config('app.timezone', 'America/Sao_Paulo');
        $now = ($now ?? now())->copy()->timezone($timezone);

        $alreadyReleased = VidaSaudeArticle::query()
            ->whereNotNull('feed_released_at')
            ->whereBetween('feed_released_at', [
                $now->copy()->startOfDay(),
                $now->copy()->endOfDay(),
            ])
            ->exists();

        if ($alreadyReleased) {
            return null;
        }

        $next = VidaSaudeArticle::query()
            ->where('is_active', true)
            ->whereNull('feed_released_at')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', $now)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->first();

        if ($next === null) {
            return null;
        }

        $next->forceFill([
            'feed_released_at' => $now,
            'feed_priority' => false,
        ])->save();

        return $next->fresh();
    }
}
