<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\News;
use App\Support\MeditationDailyFeed;
use Carbon\Carbon;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\WritesMeditationCoverCatalog;
use Tests\TestCase;

class ReassignMeditationCoversCommandTest extends TestCase
{
    use RefreshDatabase;
    use WritesMeditationCoverCatalog;

    public function test_each_published_day_receives_a_distinct_catalog_cover(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();
        $this->writeMeditationCoverCatalog(['cover-001.jpg', 'cover-002.jpg', 'cover-003.jpg']);

        foreach (['2026-10-01', '2026-10-02', '2026-10-03'] as $day) {
            News::query()->create([
                'church_id' => $church->id,
                'section' => News::SECTION_NEWS,
                'title' => 'Meditação',
                'slug' => MeditationDailyFeed::SLUG_PREFIX.$day,
                'content_type' => News::TYPE_IMAGE,
                'excerpt' => 'x',
                'body' => 'x',
                'image_url' => 'https://images.unsplash.com/photo-same?auto=format&w=1080',
                'published_at' => Carbon::parse($day)->setTime(5, 0),
                'is_active' => true,
            ]);
        }

        $this->artisan('app:reassign-meditation-covers')->assertSuccessful();

        $byDay = News::query()->orderBy('slug')->pluck('image_url', 'slug');

        $this->assertSame(
            '/images/meditation-covers/catalog/cover-003.jpg',
            $byDay[MeditationDailyFeed::SLUG_PREFIX.'2026-10-01'],
        );
        $this->assertSame(
            '/images/meditation-covers/catalog/cover-002.jpg',
            $byDay[MeditationDailyFeed::SLUG_PREFIX.'2026-10-02'],
        );
        $this->assertSame(
            '/images/meditation-covers/catalog/cover-001.jpg',
            $byDay[MeditationDailyFeed::SLUG_PREFIX.'2026-10-03'],
        );
        $this->assertCount(3, $byDay->unique());
    }
}
