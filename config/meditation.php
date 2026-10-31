<?php

use App\Support\MeditationDailyFeed;

return [
    'timezone' => env('SABBATH_TIMEZONE', 'America/Sao_Paulo'),
    /** Job `app:publish-meditation-daily-feed` (routes/console.php). */
    'publish_hour' => (int) env('MEDITATION_PUBLISH_HOUR', 5),
    /** Banner da home some neste horário (não incluso). */
    'home_banner_until_hour' => (int) env('MEDITATION_HOME_BANNER_UNTIL_HOUR', 10),
    'banner_image' => '/images/sabbath-sunset-bg.jpg',
    /**
     * Pasta do catálogo local de capas (arquivo catalog.json + imagens).
     * Vazio usa public/images/meditation-covers/catalog.
     */
    'cover_catalog_dir' => env('MEDITATION_COVER_CATALOG_DIR'),
    /**
     * Não repetir capa entre as últimas N meditações (janela visível do feed).
     */
    'cover_recent_window' => (int) env('MEDITATION_COVER_RECENT_WINDOW', MeditationDailyFeed::COVER_FEED_WINDOW),
    /**
     * Em local, ignora o horário e usa a última meditação publicada para preview.
     * Produção: deixe false (ou omita).
     */
    'home_banner_preview' => (bool) env('MEDITATION_HOME_BANNER_PREVIEW', false),
];
