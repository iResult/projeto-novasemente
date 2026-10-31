<?php

namespace App\Console\Commands;

use App\Models\News;
use App\Services\MeditationDailyCoverFetcher;
use App\Support\MeditationCoverCatalog;
use App\Support\MeditationDailyFeed;
use Illuminate\Console\Attributes\AsCommand;
use Illuminate\Console\Command;

#[AsCommand(
    name: 'app:reassign-meditation-covers',
    description: 'Troca as capas já publicadas da meditação por fotos distintas do catálogo local',
)]
class ReassignMeditationCoversCommand extends Command
{
    protected $signature = 'app:reassign-meditation-covers
                            {--dry-run : Mostra a troca sem gravar}';

    public function handle(MeditationDailyCoverFetcher $covers): int
    {
        $catalogCount = count(MeditationCoverCatalog::entries());
        if ($catalogCount === 0) {
            $this->error('Catálogo de capas vazio. Rode app:seed-meditation-cover-catalog antes.');

            return self::FAILURE;
        }

        $slugs = News::query()
            ->where('slug', 'like', MeditationDailyFeed::SLUG_PREFIX.'%')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get(['slug', 'published_at'])
            ->unique('slug')
            ->pluck('slug')
            ->map(fn ($slug) => (string) $slug)
            ->values()
            ->all();

        if ($slugs === []) {
            $this->info('Nenhuma meditação diária publicada.');

            return self::SUCCESS;
        }

        if ($catalogCount < count($slugs)) {
            $this->warn('O catálogo tem '.$catalogCount.' fotos e há '.count($slugs).' dias. As mais antigas vão repetir capa.');
        }

        $assigned = $covers->assignUrlsForSlugs($slugs);
        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;

        foreach ($assigned as $slug => $url) {
            $query = News::query()->where('slug', $slug)->where(function ($inner) use ($url) {
                $inner->where('image_url', '!=', $url)->orWhereNull('image_url');
            });
            $count = (clone $query)->count();
            if ($count === 0) {
                continue;
            }

            $updated += $count;
            $this->line($slug.' → '.$url.($dryRun ? ' (simulação)' : ''));
            if (! $dryRun) {
                $query->update(['image_url' => $url]);
            }
        }

        $this->info(($dryRun ? 'Simulação: ' : 'Atualizadas: ').$updated.' publicação(ões) em '.count($assigned).' dia(s).');

        return self::SUCCESS;
    }
}
