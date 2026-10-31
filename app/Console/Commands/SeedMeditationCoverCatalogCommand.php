<?php

namespace App\Console\Commands;

use App\Support\MeditationCoverCatalog;
use Illuminate\Console\Attributes\AsCommand;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

#[AsCommand(
    name: 'app:seed-meditation-cover-catalog',
    description: 'Baixa paisagens CC0 ou em domínio público para o catálogo local de capas',
)]
class SeedMeditationCoverCatalogCommand extends Command
{
    private const USER_AGENT = 'NovaSementeMeditationCover/1.0 (catalog seed)';

    /** @var list<string> */
    private const QUERIES = [
        'sunrise landscape hastemplate:cc-zero -painting -drawing',
        'sunset sky hastemplate:cc-zero -painting',
        'dawn photograph hastemplate:cc-zero',
        'golden hour landscape hastemplate:cc-zero',
        'seascape sunrise hastemplate:cc-zero',
        'mountain sunrise hastemplate:cc-zero',
        'lake sunrise hastemplate:cc-zero',
        'clouds sunrise hastemplate:cc-zero',
        'field sunrise hastemplate:cc-zero',
        'ocean sunrise hastemplate:cc-zero',
        'forest sunrise hastemplate:cc-zero',
        'valley sunrise hastemplate:cc-zero',
        'beach sunrise hastemplate:cc-zero',
        'mist morning landscape hastemplate:cc-zero',
        'desert sunrise hastemplate:cc-zero',
        'snow sunrise hastemplate:cc-zero',
    ];

    /** @var list<string> */
    private const REJECT_TITLE = [
        'painting', 'museum', 'sketch', 'drawing', 'engraving', 'etching',
        'portrait', 'artwork', 'canvas', 'recto', 'verso', 'illustration',
        'diagram', 'screenshot', 'watercolor', 'oil on', 'sculpture', 'poster',
        'lithograph', 'woodcut', 'fresco', 'tapestry', ' nga',
        'color checker', 'checker', 'backplate', 'girl', 'woman', 'statue',
        'sculpture', 'nude', 'station', 'parking', 'selfie', 'cemetery',
        'van der stappen', 'impressive sunrise on the field', 'a golden hour sunset',
    ];

    protected $signature = 'app:seed-meditation-cover-catalog
                            {--target=72 : Quantidade de capas}
                            {--force : Recomeça o catálogo do zero}';

    public function handle(): int
    {
        if (! extension_loaded('gd')) {
            $this->error('A extensão GD é necessária para recortar as capas.');

            return self::FAILURE;
        }

        $target = max(1, (int) $this->option('target'));
        $dir = MeditationCoverCatalog::directory();
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            $this->error('Não foi possível criar '.$dir);

            return self::FAILURE;
        }

        $images = (bool) $this->option('force') ? [] : $this->loadExisting($dir);
        if (count($images) >= $target) {
            $this->info('Catálogo já tem '.count($images).' capas em '.$dir);

            return self::SUCCESS;
        }

        $sceneKeys = [];
        foreach ($images as $image) {
            if ($image['scene_key'] !== '') {
                $sceneKeys[$image['scene_key']] = true;
            }
        }

        $this->info('Catálogo: '.count($images).'/'.$target.' em '.$dir);

        foreach (self::QUERIES as $query) {
            if (count($images) >= $target) {
                break;
            }
            $added = $this->collectQuery($query, $dir, $images, $sceneKeys, $target);
            $this->line($query.' → +'.$added.' (total '.count($images).')');
        }

        $this->writeManifest($dir, $images);

        if (count($images) < $target) {
            $this->error('Só foram encontradas '.count($images).' capas (meta '.$target.'). O feed não foi alterado.');

            return self::FAILURE;
        }

        $this->info('Catálogo pronto com '.count($images).' capas.');

        return self::SUCCESS;
    }

    /**
     * @return list<array{file: string, scene_key: string, source_title: string, author: string, license: string, source_url: string}>
     */
    private function loadExisting(string $dir): array
    {
        $path = $dir.'/catalog.json';
        if (! is_file($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        $images = is_array($decoded['images'] ?? null) ? $decoded['images'] : [];
        $kept = [];
        foreach ($images as $row) {
            if (! is_array($row)) {
                continue;
            }
            $file = basename((string) ($row['file'] ?? ''));
            if ($file === '' || ! is_file($dir.'/'.$file)) {
                continue;
            }
            $kept[] = [
                'file' => $file,
                'scene_key' => trim((string) ($row['scene_key'] ?? '')),
                'source_title' => trim((string) ($row['source_title'] ?? '')),
                'author' => trim((string) ($row['author'] ?? '')),
                'license' => trim((string) ($row['license'] ?? '')),
                'source_url' => trim((string) ($row['source_url'] ?? '')),
            ];
        }

        return $kept;
    }

    /**
     * @param  list<array{file: string, scene_key: string, source_title: string, author: string, license: string, source_url: string}>  $images
     * @param  array<string, true>  $sceneKeys
     */
    private function collectQuery(string $query, string $dir, array &$images, array &$sceneKeys, int $target): int
    {
        $added = 0;
        $offset = 0;
        $perQuery = 0;

        for ($page = 0; $page < 6 && $perQuery < 10 && count($images) < $target; $page++) {
            $response = Http::timeout(30)
                ->withHeaders([
                    'User-Agent' => self::USER_AGENT,
                    'Accept' => 'application/json',
                ])
                ->get('https://commons.wikimedia.org/w/api.php', [
                    'action' => 'query',
                    'format' => 'json',
                    'generator' => 'search',
                    'gsrsearch' => $query,
                    'gsrnamespace' => 6,
                    'gsrlimit' => 40,
                    'gsroffset' => $offset,
                    'prop' => 'imageinfo',
                    'iiprop' => 'url|mime|size|extmetadata',
                    'iiurlwidth' => 2000,
                ]);

            if (! $response->successful()) {
                $this->warn('Commons respondeu '.$response->status().' para «'.$query.'».');

                break;
            }

            $payload = $response->json();
            $pages = $payload['query']['pages'] ?? [];
            if (! is_array($pages) || $pages === []) {
                break;
            }

            foreach ($pages as $pageRow) {
                if ($perQuery >= 10 || count($images) >= $target || ! is_array($pageRow)) {
                    continue;
                }
                if ($this->storeCandidate($pageRow, $dir, $images, $sceneKeys)) {
                    $added++;
                    $perQuery++;
                    $this->writeManifest($dir, $images);
                }
            }

            $nextOffset = $payload['continue']['gsroffset'] ?? null;
            if (! is_numeric($nextOffset)) {
                break;
            }
            $offset = (int) $nextOffset;
            usleep(200_000);
        }

        return $added;
    }

    /**
     * @param  array<string, mixed>  $pageRow
     * @param  list<array{file: string, scene_key: string, source_title: string, author: string, license: string, source_url: string}>  $images
     * @param  array<string, true>  $sceneKeys
     */
    private function storeCandidate(array $pageRow, string $dir, array &$images, array &$sceneKeys): bool
    {
        $title = trim((string) ($pageRow['title'] ?? ''));
        $info = $pageRow['imageinfo'][0] ?? null;
        if ($title === '' || ! is_array($info)) {
            return false;
        }

        $sceneKey = $this->sceneKey($title);
        if ($sceneKey === '' || isset($sceneKeys[$sceneKey]) || $this->titleRejected($title)) {
            return false;
        }

        $width = (int) ($info['width'] ?? 0);
        $height = (int) ($info['height'] ?? 0);
        $mime = strtolower((string) ($info['mime'] ?? ''));
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return false;
        }
        if ($width < 1800 || $height < 1000 || $height / $width < 0.5) {
            return false;
        }

        $meta = is_array($info['extmetadata'] ?? null) ? $info['extmetadata'] : [];
        $license = $this->plainText((string) (($meta['LicenseShortName']['value'] ?? '')));
        if (! $this->isOpenLicense($license)) {
            return false;
        }

        $thumbUrl = trim((string) ($info['thumburl'] ?? ''));
        $thumbHeight = (int) ($info['thumbheight'] ?? 0);
        if ($thumbUrl === '' || $thumbHeight < 1000) {
            return false;
        }

        try {
            $download = Http::timeout(40)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get($thumbUrl);
        } catch (\Throwable $e) {
            $this->warn('Falha ao baixar '.$title.': '.$e->getMessage());

            return false;
        }

        if (! $download->successful()) {
            return false;
        }

        $bytes = $download->body();
        if (strlen($bytes) < 8_000) {
            return false;
        }

        $file = $this->nextFileName($dir, $images);
        $saved = $this->cropPortrait($bytes, $dir.'/'.$file);
        if (! $saved) {
            return false;
        }

        $author = $this->plainText((string) (($meta['Artist']['value'] ?? '')));
        if (strlen($author) > 180) {
            $author = rtrim(substr($author, 0, 177)).'…';
        }

        $wikiTitle = str_replace(' ', '_', $title);
        $images[] = [
            'file' => $file,
            'scene_key' => $sceneKey,
            'source_title' => $title,
            'author' => $author,
            'license' => $license,
            'source_url' => 'https://commons.wikimedia.org/wiki/'.rawurlencode($wikiTitle),
        ];
        $sceneKeys[$sceneKey] = true;
        usleep(150_000);

        return true;
    }

    /**
     * @param  list<array{file: string, scene_key: string, source_title: string, author: string, license: string, source_url: string}>  $images
     */
    private function nextFileName(string $dir, array $images): string
    {
        $max = 0;
        foreach ($images as $image) {
            if (preg_match('/^cover-(\d+)\./', $image['file'], $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }
        foreach (glob($dir.'/cover-*.jpg') ?: [] as $path) {
            if (is_string($path) && preg_match('/cover-(\d+)\.jpg$/', basename($path), $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }

        return sprintf('cover-%03d.jpg', $max + 1);
    }

    private function cropPortrait(string $bytes, string $destination): bool
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            return false;
        }

        $sw = imagesx($src);
        $sh = imagesy($src);
        if ($sw < 32 || $sh < 32) {
            return false;
        }

        $targetW = 1080;
        $targetH = 1350;
        $scale = max($targetW / $sw, $targetH / $sh);
        $cropW = (int) round($targetW / $scale);
        $cropH = (int) round($targetH / $scale);
        $sx = max(0, (int) round(($sw - $cropW) / 2));
        $sy = max(0, (int) round(($sh - $cropH) / 2));

        $dst = imagecreatetruecolor($targetW, $targetH);
        if ($dst === false) {
            return false;
        }

        imagecopyresampled($dst, $src, 0, 0, $sx, $sy, $targetW, $targetH, $cropW, $cropH);
        $ok = imagejpeg($dst, $destination, 82);

        return $ok && is_file($destination);
    }

    private function titleRejected(string $title): bool
    {
        $hay = strtolower($title);
        foreach (self::REJECT_TITLE as $word) {
            if (str_contains($hay, $word)) {
                return true;
            }
        }

        return false;
    }

    private function isOpenLicense(string $license): bool
    {
        if ($license === '') {
            return false;
        }
        if (stripos($license, 'CC BY') !== false || stripos($license, 'CC-BY') !== false) {
            return false;
        }

        return stripos($license, 'CC0') !== false
            || stripos($license, 'Public domain') !== false;
    }

    private function sceneKey(string $title): string
    {
        $title = preg_replace('/^File:/i', '', $title) ?? $title;
        $title = preg_replace('/\.[a-z0-9]+$/i', '', $title) ?? $title;
        $title = preg_replace('/\([^)]*\)/', ' ', $title) ?? $title;
        $title = preg_replace('/\d+/', ' ', $title) ?? $title;
        $title = strtolower($title);
        $title = preg_replace('/[^a-z]+/', ' ', $title) ?? $title;
        $title = trim(preg_replace('/\s+/', ' ', $title) ?? $title);

        return strlen($title) >= 8 ? $title : '';
    }

    private function plainText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text) ?? $text;

        return trim($text);
    }

    /**
     * @param  list<array{file: string, scene_key: string, source_title: string, author: string, license: string, source_url: string}>  $images
     */
    private function writeManifest(string $dir, array $images): void
    {
        $json = json_encode(
            [
                'images' => $images,
            ],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );

        if ($json === false) {
            return;
        }

        file_put_contents($dir.'/catalog.json', $json."\n");
    }
}
