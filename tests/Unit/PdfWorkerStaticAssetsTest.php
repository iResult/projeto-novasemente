<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PdfWorkerStaticAssetsTest extends TestCase
{
    #[Test]
    public function nginx_and_apache_serve_mjs_as_javascript(): void
    {
        $nginx = file_get_contents(base_path('deployment/nginx-mjs-mime.conf'));
        $this->assertIsString($nginx);
        $this->assertStringContainsString('application/javascript', $nginx);
        $this->assertMatchesRegularExpression('/\bmjs\b/', $nginx);

        $htaccess = file_get_contents(base_path('public/.htaccess'));
        $this->assertIsString($htaccess);
        $this->assertStringContainsString('AddType application/javascript .mjs', $htaccess);
    }

    #[Test]
    public function pdf_client_loads_same_origin_js_worker(): void
    {
        $client = file_get_contents(base_path('resources/js/lib/pdfjsClient.ts'));
        $this->assertIsString($client);
        $this->assertStringContainsString("const PDF_WORKER_PUBLIC_PATH = '/pdf.worker.min.js'", $client);
        $this->assertDoesNotMatchRegularExpression('/from [\'"][^\'"]+\\?worker/', $client);

        $vite = file_get_contents(base_path('vite.config.js'));
        $this->assertIsString($vite);
        $this->assertStringContainsString('copy-pdfjs-worker', $vite);
        $this->assertStringContainsString('pdf.worker.min.mjs', $vite);
        $this->assertStringContainsString('public/pdf.worker.min.js', $vite);
    }
}
