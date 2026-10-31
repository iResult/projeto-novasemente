<?php

namespace Tests\Unit;

use App\Support\MeditationDailyFeed;
use Tests\Support\WritesMeditationCoverCatalog;
use Tests\TestCase;

class MeditationDailyFeedTest extends TestCase
{
    use WritesMeditationCoverCatalog;

    public function test_encodes_and_parses_verse_payload(): void
    {
        $encoded = MeditationDailyFeed::encodeBody(
            'Ele o cobrirá com as Suas penas.',
            'Salmo 91:4',
            'Texto do corpo.',
        );

        $parsed = MeditationDailyFeed::parseStoredBody($encoded, 'fallback');

        $this->assertSame('Ele o cobrirá com as Suas penas.', $parsed['verse']);
        $this->assertSame('Salmo 91:4', $parsed['citation']);
        $this->assertSame('Texto do corpo.', $parsed['body']);
    }

    public function test_cover_for_date_is_a_stable_catalog_image(): void
    {
        $this->writeMeditationCoverCatalog(['cover-001.jpg', 'cover-002.jpg']);

        $a = MeditationDailyFeed::coverForDate(now()->startOfYear());
        $b = MeditationDailyFeed::coverForDate(now()->startOfYear());

        $this->assertSame($a, $b);
        $this->assertStringStartsWith('/images/meditation-covers/catalog/', $a);
    }

    public function test_extracts_verse_title_and_body_from_cpb_html(): void
    {
        $html = <<<'HTML'
<p><strong>Domingo</strong> <strong>2 de agosto</strong></p>
<h2>Sob Suas Asas</h2>
<p><em><strong>“Ele o cobrirá com as Suas penas, e, sob as Suas asas, você estará seguro.” Salmo 91:4</strong></em></p>
<p>Primeiro parágrafo da meditação de hoje.</p>
<p>Segundo parágrafo com mais reflexão.</p>
HTML;

        $parsed = MeditationDailyFeed::extractFromMeditationHtml($html);

        $this->assertSame('Sob Suas Asas', $parsed['title']);
        $this->assertSame('Ele o cobrirá com as Suas penas, e, sob as Suas asas, você estará seguro.', $parsed['verse']);
        $this->assertSame('Salmo 91:4', $parsed['citation']);
        $this->assertStringContainsString('Primeiro parágrafo', $parsed['body']);
    }
}
