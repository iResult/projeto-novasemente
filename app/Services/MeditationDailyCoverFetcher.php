<?php

namespace App\Services;

use App\Models\News;
use App\Support\MeditationCoverCatalog;
use App\Support\MeditationDailyFeed;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;

/**
 * Escolhe a capa da meditação no catálogo local, sem repetir a janela visível do feed.
 */
class MeditationDailyCoverFetcher
{
    /** Altura máxima da marca em relação à capa (centro superior). */
    private const BRAND_MARK_HEIGHT_RATIO = 0.10;

    /** Margem superior da marca, em fração da altura da capa. */
    private const BRAND_MARK_TOP_RATIO = 0.025;

    /**
     * Capa do dia. Se esse dia já tem uma imagem do catálogo, mantém.
     */
    public function resolveForDate(CarbonInterface $date): string
    {
        return $this->resolveForSlug(MeditationDailyFeed::slugForDate($date->copy()->startOfDay()));
    }

    /**
     * Mantém a capa do catálogo já gravada nesse slug; senão escolhe a usada há mais tempo
     * fora das últimas publicações.
     */
    public function resolveForSlug(string $slug): string
    {
        $existing = $this->existingCatalogCover($slug);
        if ($existing !== null) {
            return $existing;
        }

        return $this->pickCatalogUrl($this->usageExceptSlug($slug)) ?? '';
    }

    /**
     * Atribui uma capa distinta a cada slug, os mais recentes primeiro.
     *
     * @param  list<string>  $slugsNewestFirst
     * @return array<string, string>
     */
    public function assignUrlsForSlugs(array $slugsNewestFirst): array
    {
        $blocked = [];
        $lastUsed = [];
        $assigned = [];
        $order = 0;

        foreach ($slugsNewestFirst as $slug) {
            $url = $this->pickCatalogUrl([
                'blocked' => $blocked,
                'last_used' => $lastUsed,
            ]);
            if ($url === null) {
                break;
            }

            $key = $this->normalizeCoverKey($url);
            if ($key !== '') {
                $blocked[$key] = true;
                $lastUsed[$key] = $order;
            }
            $order++;
            $assigned[$slug] = $url;
        }

        return $assigned;
    }

    /**
     * @param  array{blocked: array<string, true>, last_used: array<string, int>}  $usage
     */
    private function pickCatalogUrl(array $usage): ?string
    {
        $entries = MeditationCoverCatalog::entries();
        if ($entries === []) {
            return null;
        }

        $blocked = $usage['blocked'];
        $available = [];
        foreach ($entries as $entry) {
            $key = $this->normalizeCoverKey($entry['url']);
            if ($key === '' || isset($blocked[$key])) {
                continue;
            }
            $available[] = $entry;
        }

        if ($available === []) {
            $available = $entries;
        }

        $lastUsed = $usage['last_used'];
        usort($available, function (array $a, array $b) use ($lastUsed): int {
            $keyA = $this->normalizeCoverKey($a['url']);
            $keyB = $this->normalizeCoverKey($b['url']);
            $usedA = $lastUsed[$keyA] ?? null;
            $usedB = $lastUsed[$keyB] ?? null;

            if ($usedA === null && $usedB !== null) {
                return -1;
            }
            if ($usedA !== null && $usedB === null) {
                return 1;
            }
            if ($usedA !== $usedB) {
                return $usedA <=> $usedB;
            }

            return $a['file'] <=> $b['file'];
        });

        return $available[0]['url'];
    }

    /**
     * @return array{blocked: array<string, true>, last_used: array<string, int>}
     */
    private function usageExceptSlug(string $ignoreSlug): array
    {
        $window = max(1, (int) config('meditation.cover_recent_window', MeditationDailyFeed::COVER_FEED_WINDOW));

        $posts = News::query()
            ->where('slug', 'like', MeditationDailyFeed::SLUG_PREFIX.'%')
            ->when($ignoreSlug !== '', fn ($query) => $query->where('slug', '!=', $ignoreSlug))
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get(['slug', 'image_url', 'published_at']);

        $blocked = [];
        $lastUsed = [];
        $seenSlugs = [];

        foreach ($posts as $post) {
            $key = $this->normalizeCoverKey((string) $post->image_url);
            $slug = (string) $post->slug;
            if (! isset($seenSlugs[$slug])) {
                $seenSlugs[$slug] = true;
                if (count($seenSlugs) <= $window && $key !== '') {
                    $blocked[$key] = true;
                }
            }
            if ($key !== '' && ! isset($lastUsed[$key]) && $post->published_at !== null) {
                $lastUsed[$key] = $post->published_at->getTimestamp();
            }
        }

        return [
            'blocked' => $blocked,
            'last_used' => $lastUsed,
        ];
    }

    private function existingCatalogCover(string $slug): ?string
    {
        if ($slug === '') {
            return null;
        }

        $byKey = [];
        foreach (MeditationCoverCatalog::entries() as $entry) {
            $key = $this->normalizeCoverKey($entry['url']);
            if ($key !== '') {
                $byKey[$key] = $entry['url'];
            }
        }

        if ($byKey === []) {
            return null;
        }

        $urls = News::query()
            ->where('slug', $slug)
            ->whereNotNull('image_url')
            ->orderByDesc('id')
            ->pluck('image_url');

        foreach ($urls as $url) {
            $key = $this->normalizeCoverKey((string) $url);
            if ($key !== '' && isset($byKey[$key])) {
                return $byKey[$key];
            }
        }

        return null;
    }

    /**
     * Insere a marca Nova Semente no centro superior da capa.
     *
     * @return array{bytes: string, ext: string}|null
     */
    public function applyBrandMark(string $imageBytes, string $contentType = ''): ?array
    {
        if (! extension_loaded('gd') || $imageBytes === '') {
            return null;
        }

        $logoPath = public_path('images/brand/meditation-cover-logo.png');
        if (! is_file($logoPath)) {
            return null;
        }

        $cover = @imagecreatefromstring($imageBytes);
        if ($cover === false) {
            return null;
        }

        $logo = @imagecreatefrompng($logoPath);
        if ($logo === false) {
            return null;
        }

        $coverW = imagesx($cover);
        $coverH = imagesy($cover);
        $logoW = imagesx($logo);
        $logoH = imagesy($logo);
        if ($coverW < 32 || $coverH < 32 || $logoW < 1 || $logoH < 1) {
            return null;
        }

        $targetH = max(20, (int) round($coverH * self::BRAND_MARK_HEIGHT_RATIO));
        $targetW = (int) round($logoW * ($targetH / $logoH));
        if ($targetW < 1) {
            return null;
        }

        $destX = (int) round(($coverW - $targetW) / 2);
        $destY = (int) round($coverH * self::BRAND_MARK_TOP_RATIO);

        imagealphablending($cover, true);
        imagecopyresampled(
            $cover,
            $logo,
            $destX,
            $destY,
            0,
            0,
            $targetW,
            $targetH,
            $logoW,
            $logoH,
        );

        ob_start();
        $ext = 'jpg';
        $ok = false;
        if (str_contains($contentType, 'png')) {
            imagesavealpha($cover, true);
            $ok = imagepng($cover, null, 6);
            $ext = 'png';
        } elseif (str_contains($contentType, 'webp') && function_exists('imagewebp')) {
            $ok = imagewebp($cover, null, 85);
            $ext = 'webp';
        } else {
            $ok = imagejpeg($cover, null, 88);
            $ext = 'jpg';
        }
        $bytes = (string) ob_get_clean();

        if (! $ok || $bytes === '') {
            return null;
        }

        return ['bytes' => $bytes, 'ext' => $ext];
    }

    public function normalizeCoverKey(string $url): string
    {
        $url = trim($url);
        if ($url === '') {
            return '';
        }

        if (str_contains($url, 'meditation-covers/')) {
            if (preg_match('#meditation-covers/\d{4}/(\d{4}-\d{2}-\d{2})(?:\.ns)?\.[a-z0-9]+#i', $url, $m)) {
                return 'local:'.$m[1];
            }

            return 'local:'.Str::lower(basename((string) (parse_url($url, PHP_URL_PATH) ?: $url)));
        }

        $path = parse_url($url, PHP_URL_PATH);
        $host = parse_url($url, PHP_URL_HOST);
        if (! is_string($path) || $path === '') {
            return Str::lower($url);
        }

        return Str::lower(trim((string) $host).$path);
    }
}
