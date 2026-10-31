<?php

namespace App\Console\Commands;

use App\Services\VidaSaudeFeedPublisher;
use Illuminate\Console\Command;

class PublishVidaSaudeFeedCommand extends Command
{
    protected $signature = 'vida-saude:publish-feed';

    protected $description = 'Publica um artigo da Vida e Saúde no feed, no máximo um por dia';

    public function handle(VidaSaudeFeedPublisher $publisher): int
    {
        $article = $publisher->publishNext();

        if ($article === null) {
            $this->info('Nenhum artigo novo para o feed hoje.');

            return self::SUCCESS;
        }

        $this->info('Publicado no feed: '.$article->title);

        return self::SUCCESS;
    }
}
