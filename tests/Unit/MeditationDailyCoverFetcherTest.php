<?php

namespace Tests\Unit;

use App\Models\Church;
use App\Models\News;
use App\Services\MeditationDailyCoverFetcher;
use App\Support\MeditationDailyFeed;
use Carbon\Carbon;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\WritesMeditationCoverCatalog;
use Tests\TestCase;

class MeditationDailyCoverFetcherTest extends TestCase
{
    use RefreshDatabase;
    use WritesMeditationCoverCatalog;

    public function test_picks_catalog_image_outside_the_recent_window(): void
    {
        config(['meditation.cover_recent_window' => 2]);
        $this->writeMeditationCoverCatalog(['cover-a.jpg', 'cover-b.jpg', 'cover-c.jpg']);
        $church = $this->seededChurch();

        $this->meditationNews($church->id, '2026-08-01', 'cover-a.jpg');
        $this->meditationNews($church->id, '2026-08-02', 'cover-b.jpg');

        $url = app(MeditationDailyCoverFetcher::class)->resolveForDate(Carbon::parse('2026-08-03'));

        $this->assertSame($this->catalogUrl('cover-c.jpg'), $url);
    }

    public function test_reuses_the_oldest_cover_when_the_window_includes_the_whole_catalog(): void
    {
        config(['meditation.cover_recent_window' => 10]);
        $this->writeMeditationCoverCatalog(['cover-a.jpg', 'cover-b.jpg']);
        $church = $this->seededChurch();

        $this->meditationNews($church->id, '2026-01-01', 'cover-a.jpg');
        $this->meditationNews($church->id, '2026-06-01', 'cover-b.jpg');

        $url = app(MeditationDailyCoverFetcher::class)->resolveForDate(Carbon::parse('2026-08-01'));

        $this->assertSame($this->catalogUrl('cover-a.jpg'), $url);
    }

    public function test_keeps_catalog_cover_already_saved_for_the_slug(): void
    {
        $this->writeMeditationCoverCatalog(['cover-a.jpg', 'cover-b.jpg', 'cover-c.jpg']);
        $church = $this->seededChurch();
        $today = now()->toDateString();
        $this->meditationNews($church->id, $today, 'cover-c.jpg');

        $url = app(MeditationDailyCoverFetcher::class)->resolveForDate(now());

        $this->assertSame($this->catalogUrl('cover-c.jpg'), $url);
    }

    public function test_normalize_cover_key_ignores_query_string(): void
    {
        $fetcher = app(MeditationDailyCoverFetcher::class);
        $a = $fetcher->normalizeCoverKey('https://images.unsplash.com/photo-abc?w=1080&q=80');
        $b = $fetcher->normalizeCoverKey('https://images.unsplash.com/photo-abc?w=400');
        $this->assertSame($a, $b);
    }

    public function test_normalize_cover_key_treats_branded_local_same_day(): void
    {
        $fetcher = app(MeditationDailyCoverFetcher::class);
        $plain = $fetcher->normalizeCoverKey('/storage/meditation-covers/2026/2026-08-07.jpg');
        $branded = $fetcher->normalizeCoverKey('/storage/meditation-covers/2026/2026-08-07.ns.jpg');
        $this->assertSame('local:2026-08-07', $plain);
        $this->assertSame($plain, $branded);
    }

    public function test_apply_brand_mark_places_logo_on_cover(): void
    {
        $logoPath = public_path('images/brand/meditation-cover-logo.png');
        $this->assertFileExists($logoPath);

        $fetcher = app(MeditationDailyCoverFetcher::class);
        $result = $fetcher->applyBrandMark($this->sampleJpegBytes(), 'image/jpeg');

        $this->assertNotNull($result);
        $this->assertSame('jpg', $result['ext']);
        $this->assertNotSame('', $result['bytes']);
        $this->assertTrue(strlen($result['bytes']) > 2_000);

        $out = imagecreatefromstring($result['bytes']);
        $this->assertNotFalse($out);
        $this->assertSame(800, imagesx($out));
        $this->assertSame(1000, imagesy($out));
    }

    private function seededChurch(): Church
    {
        $this->seed(ChurchSeeder::class);

        return Church::query()->firstOrFail();
    }

    private function meditationNews(int $churchId, string $day, string $file): void
    {
        News::query()->create([
            'church_id' => $churchId,
            'section' => News::SECTION_NEWS,
            'title' => 'Meditação',
            'slug' => MeditationDailyFeed::SLUG_PREFIX.$day,
            'content_type' => News::TYPE_IMAGE,
            'excerpt' => 'x',
            'body' => 'x',
            'image_url' => $this->catalogUrl($file),
            'published_at' => Carbon::parse($day)->setTime(5, 0),
            'is_active' => true,
        ]);
    }

    private function catalogUrl(string $file): string
    {
        return '/images/meditation-covers/catalog/'.$file;
    }

    private function sampleJpegBytes(): string
    {
        $cover = imagecreatetruecolor(800, 1000);
        imagefilledrectangle($cover, 0, 0, 799, 999, imagecolorallocate($cover, 40, 80, 120));
        ob_start();
        imagejpeg($cover, null, 90);

        return (string) ob_get_clean();
    }
}
