<?php

namespace App\Support;

/**
 * Catálogo local de capas da meditação diária (sem rede no dia da publicação).
 */
final class MeditationCoverCatalog
{
    public const PUBLIC_PREFIX = '/images/meditation-covers/catalog/';

    public static function directory(): string
    {
        $configured = config('meditation.cover_catalog_dir');
        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/');
        }

        return public_path('images/meditation-covers/catalog');
    }

    /**
     * @return list<array{file: string, url: string, author: string, license: string, source_url: string, scene_key: string}>
     */
    public static function entries(): array
    {
        $dir = self::directory();
        $manifest = $dir.'/catalog.json';
        $rows = [];

        if (is_file($manifest)) {
            $decoded = json_decode((string) file_get_contents($manifest), true);
            $images = is_array($decoded['images'] ?? null) ? $decoded['images'] : [];
            foreach ($images as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $file = basename((string) ($row['file'] ?? ''));
                if ($file === '' || ! is_file($dir.'/'.$file)) {
                    continue;
                }
                $rows[] = self::entry($file, $row);
            }
        }

        if ($rows !== []) {
            return $rows;
        }

        $paths = glob($dir.'/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: [];
        sort($paths);
        foreach ($paths as $path) {
            if (is_string($path) && is_file($path)) {
                $rows[] = self::entry(basename($path), []);
            }
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{file: string, url: string, author: string, license: string, source_url: string, scene_key: string}
     */
    private static function entry(string $file, array $row): array
    {
        return [
            'file' => $file,
            'url' => self::PUBLIC_PREFIX.$file,
            'author' => trim((string) ($row['author'] ?? '')),
            'license' => trim((string) ($row['license'] ?? '')),
            'source_url' => trim((string) ($row['source_url'] ?? '')),
            'scene_key' => trim((string) ($row['scene_key'] ?? '')),
        ];
    }
}
