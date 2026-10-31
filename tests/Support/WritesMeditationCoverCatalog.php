<?php

namespace Tests\Support;

trait WritesMeditationCoverCatalog
{
    /**
     * @param  list<string>  $files
     */
    protected function writeMeditationCoverCatalog(array $files): string
    {
        $dir = sys_get_temp_dir().'/ns-meditation-catalog-'.bin2hex(random_bytes(4));
        mkdir($dir);

        $images = [];
        foreach ($files as $file) {
            file_put_contents($dir.'/'.$file, $this->meditationCatalogJpeg());
            $images[] = [
                'file' => $file,
                'author' => 'Teste',
                'license' => 'CC0',
                'source_url' => 'https://example.test/'.$file,
                'scene_key' => $file,
            ];
        }

        file_put_contents($dir.'/catalog.json', json_encode(['images' => $images]));
        config(['meditation.cover_catalog_dir' => $dir]);

        return $dir;
    }

    protected function meditationCatalogJpeg(): string
    {
        $image = imagecreatetruecolor(8, 8);
        ob_start();
        imagejpeg($image, null, 90);

        return (string) ob_get_clean();
    }
}
