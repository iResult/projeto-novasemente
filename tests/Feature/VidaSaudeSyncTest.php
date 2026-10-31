<?php

namespace Tests\Feature;

use App\Models\VidaSaudeArticle;
use App\Models\VidaSaudeCategory;
use App\Services\VidaSaudeFeedPublisher;
use App\Services\VidaSaudeSyncService;
use App\Support\PublicationFeed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class VidaSaudeSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_sync_imports_catalog_without_feed_priority_and_keeps_admin_state(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-31 10:00:00', 'America/Sao_Paulo'));

        $listing = $this->listingHtml([
            $this->postPayload('post-ossos', 'Ossos fortes', '2025-01-15T03:00:00.000Z', 'https://www.vidaesaude.com.br/post/ossos-fortes'),
        ]);

        Http::fake(function ($request) use (&$listing) {
            return $this->fakeBlog($request->url(), $listing);
        });

        $result = app(VidaSaudeSyncService::class)->sync();

        $this->assertTrue($result['ok'], $result['error'] ?? json_encode($result));
        $this->assertSame(1, $result['created']);

        $article = VidaSaudeArticle::query()->where('wix_post_id', 'post-ossos')->first();
        $this->assertNotNull($article);
        $this->assertFalse($article->feed_priority);
        $this->assertNull($article->feed_released_at);
        $this->assertSame('Estilo de Vida', $article->primaryCategory?->label);
        $this->assertSame('Agatha Lemos', $article->author_name);
        $this->assertStringContainsString('Corpo do artigo', $article->body);
        $this->assertStringNotContainsString('script', strtolower($article->body));
        $this->assertCount(2, $article->categories);

        $article->update([
            'is_active' => false,
            'feed_released_at' => Carbon::parse('2026-10-01 07:00:00', 'America/Sao_Paulo'),
        ]);

        $listing = $this->listingHtml([
            $this->postPayload('post-ossos', 'Ossos fortes revisado', '2025-01-15T03:00:00.000Z', 'https://www.vidaesaude.com.br/post/ossos-fortes'),
            $this->postPayload('post-novo', 'Positividade', '2026-10-20T03:00:00.000Z', 'https://www.vidaesaude.com.br/post/positividade', ['cat-estilo']),
        ]);

        $again = app(VidaSaudeSyncService::class)->sync();
        $this->assertTrue($again['ok']);
        $this->assertSame(1, $again['created']);
        $this->assertSame(1, $again['updated']);

        $article->refresh();
        $this->assertSame('Ossos fortes revisado', $article->title);
        $this->assertFalse($article->is_active);
        $this->assertSame('2026-10-01', $article->feed_released_at?->timezone('America/Sao_Paulo')->toDateString());

        $fresh = VidaSaudeArticle::query()->where('wix_post_id', 'post-novo')->first();
        $this->assertNotNull($fresh);
        $this->assertTrue($fresh->feed_priority);
        $this->assertSame('Estilo de Vida', $fresh->primaryCategory?->label);
    }

    public function test_feed_releases_one_per_day_newest_unreleased_first(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-31 07:00:00', 'America/Sao_Paulo'));

        $oldest = $this->makeArticle('Arquivo antigo', '2024-06-01 08:00:00');
        $middle = $this->makeArticle('Arquivo do meio', '2025-03-01 08:00:00');
        $current = $this->makeArticle('Artigo de agora', '2026-10-20 08:00:00');

        $publisher = app(VidaSaudeFeedPublisher::class);

        $first = $publisher->publishNext();
        $this->assertNotNull($first);
        $this->assertSame($current->id, $first->id);
        $this->assertNull($publisher->publishNext());

        Carbon::setTestNow(Carbon::parse('2026-11-03 07:00:00', 'America/Sao_Paulo'));
        $second = $publisher->publishNext();
        $this->assertNotNull($second);
        $this->assertSame($middle->id, $second->id);

        Carbon::setTestNow(Carbon::parse('2026-11-04 07:00:00', 'America/Sao_Paulo'));
        $third = $publisher->publishNext();
        $this->assertNotNull($third);
        $this->assertSame($oldest->id, $third->id);

        $this->assertSame(3, VidaSaudeArticle::query()->whereNotNull('feed_released_at')->count());
    }

    public function test_feed_hides_articles_until_they_are_released(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-31 12:00:00', 'America/Sao_Paulo'));

        $waiting = $this->makeArticle('Ainda na fila', '2024-02-01 08:00:00');
        $released = $this->makeArticle('Já publicado', '2023-05-01 08:00:00', [
            'feed_released_at' => Carbon::parse('2026-10-31 07:00:00', 'America/Sao_Paulo'),
        ]);
        $this->makeArticle('Desativado', '2022-01-01 08:00:00', [
            'is_active' => false,
            'feed_released_at' => Carbon::parse('2026-10-30 07:00:00', 'America/Sao_Paulo'),
        ]);

        $request = Request::create('/mobile/publicacoes', 'GET', ['type' => 'vida_saude']);
        $request->setLaravelSession($this->app['session']->driver());
        $page = PublicationFeed::paginatedForRequest($request, null);
        $titles = collect($page['items']['data'])->pluck('title')->all();

        $this->assertSame(['Já publicado'], $titles);
        $this->assertNotContains($waiting->title, $titles);
        $releasedItem = $page['items']['data'][0];
        $this->assertSame('vida_saude', $releasedItem['type']);
        $this->assertStringStartsWith('2026-10-31', $releasedItem['published_at']);
        $this->assertContains('Estilo de Vida', $releasedItem['meta']);
    }

    public function test_mobile_page_lists_every_article_and_show_page_opens(): void
    {
        $category = VidaSaudeCategory::query()->create([
            'wix_category_id' => 'cat-nutricao',
            'slug' => 'nutricao',
            'label' => 'Nutrição',
            'display_position' => 1,
        ]);

        VidaSaudeArticle::query()->create([
            'wix_post_id' => 'post-pagina',
            'title' => 'In natura é melhor',
            'slug' => 'in-natura-e-melhor',
            'excerpt' => 'Sabor e praticidade.',
            'body' => '<p>Texto do artigo.</p>',
            'source_url' => 'https://www.vidaesaude.com.br/post/in-natura',
            'primary_category_id' => $category->id,
            'is_active' => true,
            'published_at' => Carbon::parse('2026-01-10 08:00:00', 'America/Sao_Paulo'),
        ]);

        $this->get(route('mobile.vida-e-saude'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/VidaSaude')
                ->has('latest', 1)
                ->where('latest.0.title', 'In natura é melhor')
                ->where('latest.0.section_label', 'Nutrição'));

        $this->get(route('mobile.vida-e-saude.show', 'in-natura-e-melhor'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/VidaSaudeShow')
                ->where('article.title', 'In natura é melhor'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeArticle(string $title, string $publishedAt, array $overrides = []): VidaSaudeArticle
    {
        $category = VidaSaudeCategory::query()->firstOrCreate(
            ['wix_category_id' => 'cat-estilo'],
            ['slug' => 'estilo-de-vida', 'label' => 'Estilo de Vida', 'display_position' => 0],
        );

        return VidaSaudeArticle::query()->create(array_merge([
            'wix_post_id' => (string) Str::uuid(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'excerpt' => 'Resumo',
            'body' => '<p>'.$title.'</p>',
            'author_name' => 'Agatha Lemos',
            'source_url' => 'https://www.vidaesaude.com.br/post/'.Str::slug($title),
            'primary_category_id' => $category->id,
            'is_active' => true,
            'feed_priority' => false,
            'published_at' => Carbon::parse($publishedAt, 'America/Sao_Paulo'),
        ], $overrides));
    }

    /**
     * @param  list<array<string, mixed>>  $posts
     */
    private function listingHtml(array $posts): string
    {
        $warmup = [
            'appsWarmupData' => [
                VidaSaudeSyncService::BLOG_APP_ID => [
                    'feed-page-test' => json_encode([
                        'feedResponse' => [
                            'postFeedPage' => [
                                'categories' => [
                                    [
                                        'id' => 'cat-estilo',
                                        'label' => 'Estilo de Vida',
                                        'postCount' => 2,
                                    ],
                                    [
                                        'id' => 'cat-plena',
                                        'label' => 'Vida Plena',
                                        'postCount' => 1,
                                    ],
                                ],
                                'posts' => ['posts' => $posts],
                            ],
                        ],
                    ], JSON_UNESCAPED_UNICODE),
                ],
            ],
        ];

        return '<html><script type="application/json" id="wix-warmup-data">'
            .json_encode($warmup, JSON_UNESCAPED_UNICODE)
            .'</script></html>';
    }

    /**
     * @param  list<string>  $categoryIds
     * @return array<string, mixed>
     */
    private function postPayload(string $id, string $title, string $publishedAt, string $link, array $categoryIds = ['cat-estilo', 'cat-plena']): array
    {
        return [
            'id' => $id,
            'title' => $title,
            'excerpt' => 'Resumo de '.$title,
            'firstPublishedDate' => $publishedAt,
            'lastPublishedDate' => $publishedAt,
            'link' => $link,
            'categoryIds' => $categoryIds,
            'owner' => ['name' => 'Agatha Lemos'],
            'media' => [
                'wixMedia' => [
                    'image' => ['url' => 'https://static.wixstatic.com/media/cover.jpg'],
                ],
            ],
        ];
    }

    private function fakeBlog(string $url, string $listing)
    {
        if (str_contains($url, '/blog/page/')) {
            return Http::response('<html></html>', 200);
        }

        if (str_contains($url, '/blog')) {
            return Http::response($listing, 200);
        }

        if (str_contains($url, '/post/')) {
            return Http::response(
                '<section data-hook="post-description"><p>Corpo do artigo.</p><script>alert(1)</script></section>',
                200,
            );
        }

        return Http::response('missing', 404);
    }
}
