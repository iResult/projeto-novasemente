<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\Culto;
use App\Models\Event;
use App\Models\News;
use App\Models\User;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeFeedHighlightsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['publications_feed.preview_only' => false]);
        $this->seed(ChurchSeeder::class);
    }

    public function test_home_highlights_keep_the_five_most_recent_visible_posts(): void
    {
        $church = Church::query()->firstOrFail();
        $user = User::factory()->create([
            'church_id' => $church->id,
            'email' => 'membro@example.com',
        ]);

        foreach (range(0, 5) as $index) {
            $this->news($church, "Destaque {$index}", now()->subMinutes($index + 1));
        }

        $this->news($church, 'Rascunho', now(), ['is_active' => false, 'slug' => 'rascunho']);
        $this->news($church, 'Agendada', now()->addDay(), ['slug' => 'agendada']);
        $this->news($church, '<b>Texto seguro</b>', now(), ['slug' => 'texto-seguro']);

        $other = Church::query()->create([
            'name' => 'Outra Igreja',
            'slug' => 'outra-igreja',
            'active' => true,
        ]);
        $this->news($other, 'De outra igreja', now()->addMinutes(2), ['slug' => 'outra-igreja-post']);

        $this->actingAs($user)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Home')
                ->has('feedHighlights', 5)
                ->where('feedHighlights.0.title', 'Texto seguro')
                ->where('feedHighlights.0.excerpt', 'Resumo limpo')
                ->where('feedHighlights', fn ($items) => collect($items)->pluck('title')->all() === [
                    'Texto seguro',
                    'Destaque 0',
                    'Destaque 1',
                    'Destaque 2',
                    'Destaque 3',
                ]));
    }

    public function test_home_highlights_skip_ended_events_and_keep_upcoming_ones(): void
    {
        $church = Church::query()->firstOrFail();
        $user = User::factory()->create(['church_id' => $church->id]);

        Event::query()->create([
            'church_id' => $church->id,
            'title' => 'Evento encerrado',
            'starts_at' => now()->subDays(2),
            'ends_at' => now()->subDay(),
            'published_at' => now(),
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        Event::query()->create([
            'church_id' => $church->id,
            'title' => 'Evento futuro',
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDays(2),
            'published_at' => now()->subMinute(),
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('feedHighlights', function ($items) {
                    $titles = collect($items)->pluck('title');

                    return $titles->contains('Evento futuro')
                        && ! $titles->contains('Evento encerrado');
                }));
    }

    public function test_home_highlights_drop_logo_fallback_and_keep_real_cover_and_video_flag(): void
    {
        $church = Church::query()->firstOrFail();
        $church->update(['logo_url' => 'https://cdn.example/logo.png']);
        $user = User::factory()->create(['church_id' => $church->id]);

        $this->news($church, 'Sem foto', now()->subMinutes(2), ['slug' => 'sem-foto']);
        $this->news($church, 'Com arte', now()->subMinute(), [
            'slug' => 'com-arte',
            'image_url' => 'https://cdn.example/arte-noticia.jpg',
        ]);
        $this->news($church, 'Com vídeo', now(), [
            'slug' => 'com-video',
            'has_video' => true,
            'image_url' => 'https://cdn.example/capa-horizontal.jpg',
            'content_type' => News::TYPE_YOUTUBE,
            'youtube_url' => 'https://www.youtube.com/watch?v=abcdefghijk',
        ]);

        $this->actingAs($user)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('feedHighlights', function ($items) {
                    $rows = collect($items)->keyBy('title');
                    $plain = $rows->get('Sem foto');
                    $art = $rows->get('Com arte');
                    $video = $rows->get('Com vídeo');

                    return is_array($plain)
                        && $plain['image_url'] === null
                        && $plain['presentation'] === 'text'
                        && is_array($art)
                        && $art['image_url'] === 'https://cdn.example/arte-noticia.jpg'
                        && $art['presentation'] === 'safe'
                        && is_array($video)
                        && $video['image_url'] === 'https://cdn.example/capa-horizontal.jpg'
                        && $video['cover_play_overlay'] === true
                        && $video['presentation'] === 'video'
                        && str_contains((string) $video['href'], 'com-video');
                }));
    }

    public function test_home_highlights_label_recorded_culto_without_calling_it_live(): void
    {
        $church = Church::query()->firstOrFail();
        $church->update(['youtube_live_url' => 'https://www.youtube.com/watch?v=livevideo11']);
        $user = User::factory()->create(['church_id' => $church->id]);

        Culto::query()->create([
            'church_id' => $church->id,
            'title' => 'Série gravada',
            'youtube_url' => 'https://www.youtube.com/watch?v=recorded011',
            'published_at' => now()->subMinute(),
            'created_by' => $user->id,
        ]);

        Culto::query()->create([
            'church_id' => $church->id,
            'title' => 'Transmissão atual',
            'youtube_url' => 'https://www.youtube.com/watch?v=livevideo11',
            'published_at' => now(),
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('feedHighlights', function ($items) {
                    $rows = collect($items)->keyBy('title');
                    $recorded = $rows->get('Série gravada');
                    $live = $rows->get('Transmissão atual');

                    return is_array($recorded)
                        && $recorded['presentation'] === 'video'
                        && $recorded['type_label'] === 'Culto'
                        && is_array($live)
                        && $live['presentation'] === 'video'
                        && $live['type_label'] === 'Ao vivo';
                }));
    }

    public function test_home_highlights_respect_feed_preview_and_disabled_news(): void
    {
        $church = Church::query()->firstOrFail();
        $this->news($church, 'Privada no preview', now());

        config([
            'publications_feed.preview_only' => true,
            'publications_feed.preview_emails' => ['admin@example.com'],
        ]);

        $member = User::factory()->create([
            'church_id' => $church->id,
            'email' => 'membro@example.com',
        ]);

        $this->actingAs($member)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('feedHighlights', []));

        config(['publications_feed.preview_only' => false]);
        $church->update(['disabled_app_features' => ['news']]);

        $this->actingAs($member)
            ->withSession(['working_church_id' => $church->id])
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('feedHighlights', []));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function news(Church $church, string $title, \DateTimeInterface $publishedAt, array $overrides = []): News
    {
        $slug = $overrides['slug'] ?? str($title)->slug()->toString();

        return News::query()->create(array_merge([
            'church_id' => $church->id,
            'section' => News::SECTION_NEWS,
            'title' => $title,
            'slug' => $slug !== '' ? $slug : 'noticia',
            'content_type' => News::TYPE_ARTICLE,
            'excerpt' => 'Resumo limpo',
            'body' => '<p>Corpo completo que não deve ir para o carrossel.</p>',
            'published_at' => $publishedAt,
            'is_active' => true,
        ], $overrides));
    }
}
