<?php

namespace App\Console\Commands;

use App\Services\VidaSaudeSyncService;
use Illuminate\Console\Command;

class SyncVidaSaudeCommand extends Command
{
    protected $signature = 'vida-saude:sync';

    protected $description = 'Importa ou atualiza artigos do blog Vida e Saúde';

    public function handle(VidaSaudeSyncService $syncService): int
    {
        $this->info('Sincronizando Vida e Saúde…');

        $result = $syncService->sync();

        if (! ($result['ok'] ?? false)) {
            $this->error($result['error'] ?? 'Falha na sincronização.');

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Concluído: %d criados, %d atualizados, %d ignorados.',
            $result['created'],
            $result['updated'],
            $result['skipped'],
        ));

        return self::SUCCESS;
    }
}
