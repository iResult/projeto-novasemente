<?php

namespace App\Services;

use App\Models\VidaSaudeArticle;
use App\Models\VidaSaudeCategory;
use DOMDocument;
use DOMNode;
use DOMXPath;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class VidaSaudeSyncService
{
    public const BLOG_URL = 'https://www.vidaesaude.com.br/blog';

    public const BLOG_APP_ID = '14bcded7-0066-7c35-14d7-466cb3f09103';

    public const PRIORITY_DAYS = 30;

    private const MAX_PAGES = 15;

    /**
     * @return array{ok: bool, created: int, updated: int, skipped: int, error?: string}
     */
    public function sync(): array
    {
        $isInitialImport = ! VidaSaudeArticle::query()->exists();
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $seenPostIds = [];
        $categoriesSynced = false;

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            $fetched = $this->fetchHtml($this->listingUrl($page));
            if (! ($fetched['ok'] ?? false)) {
                if ($page > 1) {
                    break;
                }

                return [
                    'ok' => false,
                    'created' => $created,
                    'updated' => $updated,
                    'skipped' => $skipped,
                    'error' => $fetched['error'] ?? 'Falha ao buscar o blog Vida e Saúde.',
                ];
            }

            $parsed = $this->parseListingHtml((string) ($fetched['html'] ?? ''));
            $posts = $parsed['posts'];
            if ($posts === []) {
                break;
            }

            if (! $categoriesSynced && $parsed['categories'] !== []) {
                $this->upsertCategories($parsed['categories']);
                $categoriesSynced = true;
            }

            $newOnPage = 0;
            foreach ($posts as $post) {
                $wixId = trim((string) ($post['id'] ?? ''));
                if ($wixId === '' || isset($seenPostIds[$wixId])) {
                    continue;
                }
                $seenPostIds[$wixId] = true;
                $newOnPage++;

                $result = $this->upsertPost($post, $isInitialImport);
                if ($result === 'created') {
                    $created++;
                } elseif ($result === 'updated') {
                    $updated++;
                } else {
                    $skipped++;
                }
            }

            if ($newOnPage === 0) {
                break;
            }
        }

        return [
            'ok' => true,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        ];
    }

    public function listingUrl(int $page): string
    {
        if ($page <= 1) {
            return self::BLOG_URL;
        }

        return self::BLOG_URL.'/page/'.$page;
    }

    /**
     * @return array{categories: list<array<string, mixed>>, posts: list<array<string, mixed>>}
     */
    public function parseListingHtml(string $html): array
    {
        if (! preg_match('/<script[^>]*id="wix-warmup-data"[^>]*>(.*?)<\/script>/s', $html, $match)) {
            return ['categories' => [], 'posts' => []];
        }

        $warmup = json_decode(html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5), true);
        if (! is_array($warmup)) {
            $warmup = json_decode($match[1], true);
        }
        if (! is_array($warmup)) {
            return ['categories' => [], 'posts' => []];
        }

        $apps = $warmup['appsWarmupData'][self::BLOG_APP_ID] ?? null;
        if (! is_array($apps)) {
            return ['categories' => [], 'posts' => []];
        }

        foreach ($apps as $key => $raw) {
            if (! is_string($key) || ! str_starts_with($key, 'feed-page-')) {
                continue;
            }

            $feed = is_string($raw) ? json_decode($raw, true) : $raw;
            if (! is_array($feed)) {
                continue;
            }

            $page = $feed['feedResponse']['postFeedPage'] ?? null;
            if (! is_array($page)) {
                continue;
            }

            $posts = $page['posts']['posts'] ?? [];
            $categories = $page['categories'] ?? [];

            return [
                'categories' => is_array($categories) ? array_values(array_filter($categories, 'is_array')) : [],
                'posts' => is_array($posts) ? array_values(array_filter($posts, 'is_array')) : [],
            ];
        }

        return ['categories' => [], 'posts' => []];
    }

    public function extractPostBody(string $html): string
    {
        $fragment = $this->postDescriptionFragment($html);
        if ($fragment === '') {
            return '';
        }

        $previous = libxml_use_internal_errors(true);
        $dom = new DOMDocument;
        $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>'.$fragment, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            return '';
        }

        $xpath = new DOMXPath($dom);
        $nodes = $xpath->query('//*[@data-hook="post-description"]');
        if ($nodes === false || $nodes->length === 0) {
            return '';
        }

        $node = $nodes->item(0);
        if (! $node instanceof DOMNode) {
            return '';
        }

        $this->removeNodes($xpath, './/script|.//style', $node);
        $inner = $this->innerHtml($node);
        $text = trim(html_entity_decode(strip_tags($inner)));
        if ($text === '') {
            return '';
        }

        return trim($inner);
    }

    /**
     * A página do Wix passa de 1 MB. O DOM só recebe o bloco do artigo.
     */
    private function postDescriptionFragment(string $html): string
    {
        $hook = strpos($html, 'data-hook="post-description"');
        if ($hook === false) {
            return '';
        }

        $lookbehind = substr($html, max(0, $hook - 300), min(300, $hook));
        $relative = strrpos($lookbehind, '<section');
        $tagStart = $relative === false ? $hook : max(0, $hook - 300) + $relative;
        $fragment = substr($html, $tagStart, 160000);
        $close = strpos($fragment, '</section>');
        if ($close === false) {
            return $fragment;
        }

        return substr($fragment, 0, $close + strlen('</section>'));
    }

    /**
     * @param  list<array<string, mixed>>  $categories
     */
    private function upsertCategories(array $categories): void
    {
        foreach (array_values($categories) as $index => $category) {
            $wixId = trim((string) ($category['id'] ?? ''));
            $label = $this->plainText((string) ($category['label'] ?? ''));
            if ($wixId === '' || $label === '') {
                continue;
            }

            $postCount = $category['postCount'] ?? null;
            $existing = VidaSaudeCategory::query()->where('wix_category_id', $wixId)->first();
            $payload = [
                'label' => $label,
                'display_position' => $index,
                'post_count' => is_numeric($postCount) ? (int) $postCount : null,
            ];

            if ($existing === null) {
                VidaSaudeCategory::query()->create([
                    ...$payload,
                    'wix_category_id' => $wixId,
                    'slug' => $this->uniqueCategorySlug($label),
                ]);
            } else {
                $existing->fill($payload);
                if ($existing->isDirty()) {
                    $existing->save();
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $post
     */
    private function upsertPost(array $post, bool $isInitialImport): string
    {
        $wixId = trim((string) ($post['id'] ?? ''));
        $title = $this->plainText((string) ($post['title'] ?? ''));
        $sourceUrl = $this->sourceUrl($post);
        $publishedAt = $this->parseDate($post['firstPublishedDate'] ?? null);
        if ($wixId === '' || $title === '' || $sourceUrl === '' || $publishedAt === null) {
            return 'skipped';
        }

        $modifiedAt = $this->parseDate($post['lastPublishedDate'] ?? null) ?? $publishedAt;
        $existing = VidaSaudeArticle::query()->where('wix_post_id', $wixId)->first();
        $needsBody = $existing === null
            || trim((string) $existing->body) === ''
            || $existing->source_modified_at === null
            || ! $existing->source_modified_at->equalTo($modifiedAt);

        $body = $existing?->body ?? '';
        if ($needsBody) {
            $fetched = $this->fetchHtml($sourceUrl);
            if (! ($fetched['ok'] ?? false)) {
                if ($existing === null) {
                    return 'skipped';
                }
            } else {
                $extracted = $this->extractPostBody((string) ($fetched['html'] ?? ''));
                if ($extracted !== '') {
                    $body = $extracted;
                } elseif ($existing === null) {
                    return 'skipped';
                }
            }
        }

        if (trim(strip_tags($body)) === '') {
            return 'skipped';
        }

        $categoryIds = $this->localCategoryIds($post);
        $payload = [
            'title' => $title,
            'excerpt' => $this->excerpt($post),
            'body' => $body,
            'author_name' => $this->authorName($post),
            'source_url' => $sourceUrl,
            'image_url' => $this->imageUrl($post),
            'primary_category_id' => $categoryIds[0] ?? null,
            'published_at' => $publishedAt,
            'source_modified_at' => $modifiedAt,
            'synced_at' => now(),
        ];

        if ($existing === null) {
            $recentCutoff = now()->subDays(self::PRIORITY_DAYS);
            $article = VidaSaudeArticle::query()->create([
                ...$payload,
                'wix_post_id' => $wixId,
                'slug' => $this->uniqueArticleSlug($title),
                'is_active' => true,
                'feed_priority' => ! $isInitialImport && $publishedAt->greaterThanOrEqualTo($recentCutoff) && $publishedAt->lessThanOrEqualTo(now()),
            ]);
            $article->categories()->sync($categoryIds);

            return 'created';
        }

        $existing->fill($payload);
        $changed = $existing->isDirty();
        if ($changed) {
            $existing->save();
        }
        $existing->categories()->sync($categoryIds);

        return $changed ? 'updated' : 'skipped';
    }

    /**
     * @param  array<string, mixed>  $post
     * @return list<int>
     */
    private function localCategoryIds(array $post): array
    {
        $wixIds = array_values(array_filter(array_map(
            fn ($id) => trim((string) $id),
            (array) ($post['categoryIds'] ?? []),
        )));
        if ($wixIds === []) {
            return [];
        }

        $byWix = VidaSaudeCategory::query()
            ->whereIn('wix_category_id', $wixIds)
            ->get()
            ->keyBy('wix_category_id');

        $ids = [];
        foreach ($wixIds as $wixId) {
            $category = $byWix->get($wixId);
            if ($category !== null) {
                $ids[] = $category->id;
            }
        }

        return $ids;
    }

    /**
     * @param  array<string, mixed>  $post
     */
    private function sourceUrl(array $post): string
    {
        $link = trim((string) ($post['link'] ?? ''));
        if ($link !== '') {
            return $link;
        }

        $url = $post['url'] ?? null;
        if (! is_array($url)) {
            return '';
        }

        $base = rtrim((string) ($url['base'] ?? ''), '/');
        $path = (string) ($url['path'] ?? '');
        if ($base === '' || $path === '') {
            return '';
        }

        return $base.'/'.ltrim($path, '/');
    }

    /**
     * @param  array<string, mixed>  $post
     */
    private function imageUrl(array $post): ?string
    {
        $media = $post['media'] ?? null;
        if (! is_array($media)) {
            return null;
        }

        $url = $media['wixMedia']['image']['url'] ?? null;
        $url = is_string($url) ? trim($url) : '';

        return $url !== '' ? $url : null;
    }

    /**
     * @param  array<string, mixed>  $post
     */
    private function authorName(array $post): ?string
    {
        $owner = $post['owner'] ?? null;
        $name = is_array($owner) ? $this->plainText((string) ($owner['name'] ?? '')) : '';

        return $name !== '' ? $name : null;
    }

    /**
     * @param  array<string, mixed>  $post
     */
    private function excerpt(array $post): ?string
    {
        $text = $this->plainText((string) ($post['excerpt'] ?? ''));
        if ($text === '') {
            return null;
        }

        return Str::limit($text, 500, '');
    }

    private function parseDate(mixed $value): ?Carbon
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function plainText(string $value): string
    {
        $text = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    private function uniqueArticleSlug(string $title): string
    {
        return $this->uniqueSlug($title, VidaSaudeArticle::class);
    }

    private function uniqueCategorySlug(string $label): string
    {
        return $this->uniqueSlug($label, VidaSaudeCategory::class);
    }

    /**
     * @param  class-string<VidaSaudeArticle|VidaSaudeCategory>  $model
     */
    private function uniqueSlug(string $label, string $model): string
    {
        $base = Str::slug($label);
        if ($base === '') {
            $base = 'item';
        }

        $slug = $base;
        $suffix = 2;
        while ($model::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    /**
     * @return array{ok: bool, html?: string, error?: string}
     */
    private function fetchHtml(string $url): array
    {
        try {
            $response = Http::timeout(45)
                ->retry(3, 750, function ($exception) {
                    if ($exception instanceof RequestException) {
                        $status = $exception->response?->status();

                        return in_array($status, [408, 425, 429, 500, 502, 503, 504], true);
                    }

                    return true;
                }, throw: false)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; NovaSemente/1.0; +https://novasemente.app; vida-e-saude sync)',
                    'Accept' => 'text/html',
                ])
                ->get($url);

            if ($response->status() === 404) {
                return ['ok' => false, 'error' => 'Página não encontrada.'];
            }

            if (! $response->successful()) {
                return ['ok' => false, 'error' => 'Não foi possível acessar o blog Vida e Saúde (HTTP '.$response->status().').'];
            }

            return ['ok' => true, 'html' => $response->body()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'Erro ao buscar o blog Vida e Saúde: '.$e->getMessage()];
        }
    }

    private function removeNodes(DOMXPath $xpath, string $expression, DOMNode $context): void
    {
        $nodes = $xpath->query($expression, $context);
        if ($nodes === false) {
            return;
        }

        $remove = [];
        foreach ($nodes as $node) {
            $remove[] = $node;
        }
        foreach ($remove as $node) {
            $node->parentNode?->removeChild($node);
        }
    }

    private function innerHtml(DOMNode $node): string
    {
        $html = '';
        foreach ($node->childNodes as $child) {
            $html .= $node->ownerDocument?->saveHTML($child) ?? '';
        }

        return $html;
    }
}
