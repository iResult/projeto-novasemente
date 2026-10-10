<?php

namespace Tests\Unit;

use App\Services\SaturdayProgramPdfParser;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SaturdayProgramPdfParserTest extends TestCase
{
    #[Test]
    public function it_parses_the_sample_saturday_program_pdf(): void
    {
        $path = base_path('tests/fixtures/saturday-program-sample.pdf');
        $this->assertFileExists($path);

        $schedule = (new SaturdayProgramPdfParser)->parseFile($path);

        $this->assertSame(1, $schedule['version']);
        $this->assertNotNull($schedule['heading']);
        $this->assertStringContainsStringIgnoringCase('CULTO', (string) $schedule['heading']);
        $this->assertSame('5 September 2026', $schedule['date_label']);

        $this->assertSame([], $schedule['crew']);

        $items = $schedule['items'];
        $this->assertGreaterThan(20, count($items));

        $titles = array_map(
            static fn (array $row) => $row['kind'] === 'item' ? ($row['title'] ?? '') : ($row['title'] ?? ''),
            $items,
        );

        $this->assertTrue(
            collect($titles)->contains(fn (string $t) => str_contains(mb_strtoupper($t), 'TESTE DE SOM')),
        );
        $this->assertTrue(
            collect($titles)->contains(fn (string $t) => str_contains(mb_strtoupper($t), 'MENSAGEM')),
        );
        $this->assertTrue(
            collect($titles)->contains(fn (string $t) => str_contains(mb_strtoupper($t), 'CONVIVA')),
        );

        $timed = array_values(array_filter($items, fn (array $row) => ($row['kind'] ?? '') === 'item'));
        $this->assertSame('08:00', $timed[0]['start']);
        $this->assertNull($timed[0]['person'] ?? null);
        $this->assertNull($timed[0]['notes'] ?? null);
    }

    #[Test]
    public function it_parses_glued_start_and_duration(): void
    {
        $text = <<<'TXT'
CULTO DE SÁBADO
5 September 2026
Produção: Equipe A
10:1440:00MENSAGEM
Person:Pr. Igor
CONVIVA
12:03:306:00LOUVOR 1: No Teu Altar	Person:Louvor | Banda
TXT;

        $schedule = (new SaturdayProgramPdfParser)->parseText($text);

        $items = $schedule['items'];
        $this->assertSame('item', $items[0]['kind']);
        $this->assertSame('10:14', $items[0]['start']);
        $this->assertSame('40:00', $items[0]['duration']);
        $this->assertStringContainsStringIgnoringCase('MENSAGEM', $items[0]['title']);

        $this->assertSame('section', $items[1]['kind']);
        $this->assertSame('CONVIVA', $items[1]['title']);

        $this->assertSame('12:03:30', $items[2]['start']);
        $this->assertSame('6:00', $items[2]['duration']);
    }

    #[Test]
    public function it_never_exposes_crew_person_or_notes(): void
    {
        $text = <<<'TXT'
CULTO DE SÁBADO
5 September 2026
Produção: Equipe A
Diaconato: João e Maria
10:1440:00MENSAGEM PASTORAL
Person:Pr. Nome Do Pregador
Notas do sermão ocultas
12:03:306:00LOUVOR 1: No Teu Altar	Person:Louvor | Banda
TXT;

        $parser = new SaturdayProgramPdfParser;
        $schedule = $parser->parseText($text);
        $this->assertSame([], $schedule['crew']);

        foreach ($schedule['items'] as $row) {
            if (($row['kind'] ?? '') !== 'item') {
                continue;
            }
            $this->assertNull($row['person'] ?? null);
            $this->assertNull($row['notes'] ?? null);
        }

        $dirty = [
            'version' => 1,
            'crew' => [['role' => 'Produção', 'names' => 'Equipe']],
            'items' => [
                [
                    'kind' => 'item',
                    'start' => '11:00',
                    'title' => 'Louvor',
                    'person' => 'Banda',
                    'notes' => 'Letra',
                ],
            ],
        ];
        $clean = $parser->sanitizeSchedule($dirty);
        $this->assertSame([], $clean['crew']);
        $this->assertNull($clean['items'][0]['person']);
        $this->assertNull($clean['items'][0]['notes']);
    }

    #[Test]
    public function it_collapses_sidebar_phase_blocks_and_skips_totals(): void
    {
        $path = base_path('tests/fixtures/saturday-program-sample.pdf');
        $schedule = (new SaturdayProgramPdfParser)->parseFile($path);
        $items = $schedule['items'];

        $sectionTitles = array_column(
            array_values(array_filter($items, static fn (array $row) => ($row['kind'] ?? '') === 'section')),
            'title',
        );

        $this->assertNotContains('PRÉ ABERTURA - 1º CULTO', $sectionTitles);
        $this->assertNotContains('BOAS VINDAS - 1º CULTO', $sectionTitles);
        $this->assertNotContains('LOUVOR - 1º CULTO', $sectionTitles);
        $this->assertContains('CONVIVA', $sectionTitles);
        $this->assertTrue(
            collect($sectionTitles)->contains(
                fn (string $t) => str_contains(mb_strtoupper($t), 'INTERVALO') || $t === '2º CULTO',
            ),
        );

        $maxRun = 0;
        $run = 0;
        foreach ($items as $row) {
            if (($row['kind'] ?? '') === 'section') {
                $run++;
                $maxRun = max($maxRun, $run);
            } else {
                $run = 0;
            }
        }
        $this->assertLessThanOrEqual(3, $maxRun);

        $starts = array_column(
            array_filter($items, static fn (array $r) => ($r['kind'] ?? '') === 'item'),
            'start',
        );
        $this->assertNotContains('13:39:30', $starts);
    }

    #[Test]
    public function it_anchors_service_dividers_when_the_sidebar_lands_mid_second_service(): void
    {
        $text = <<<'TXT'
CULTO DE SÁBADO
10 October 2026
09:26:303:00COUNT DOWN DE 3 MINUTOS
10:0940:00MENSAGEM
10:56 2:00ORIENTAÇÕES DE SAÍDA
11:0445:00INTRODUÇÃO | ORAÇÃO | EXPLANAÇÃO DA LIÇÃO
11:4910:00ABERTURA DAS PORTAS | TROCA DE AUDITÓRIO
11:59 1:00FECHAMENTO DAS PORTAS
12:00 3:00COUNT DOWN DE 3 MINUTOS
12:03 0:30ENTRADA DO VOCAL | INÍCIO DO LOUVOR
12:03:306:00LOUVOR 1:Escape
12:35:305:00LOUVOR 3: Porque Ele Vive
CONVIVA
INTERVALO | ORGANIZAÇÃO DO 2º CULTO
PRÉ-ABERTURA - 2º CULTO
12:40:306:00LOUVOR 4:Algo Novo
TXT;

        $items = (new SaturdayProgramPdfParser)->parseText($text)['items'];
        $titles = array_map(static fn (array $row): string => (string) ($row['title'] ?? ''), $items);

        $conviva = array_search('CONVIVA', $titles, true);
        $lesson = array_search('INTRODUÇÃO | ORAÇÃO | EXPLANAÇÃO DA LIÇÃO', $titles, true);
        $interval = array_search('INTERVALO | ORGANIZAÇÃO DO 2º CULTO', $titles, true);
        $second = array_search('2º CULTO', $titles, true);
        $noonCountdown = null;
        $afternoonPraise = null;
        foreach ($items as $index => $row) {
            if (($row['kind'] ?? '') !== 'item') {
                continue;
            }
            if (($row['start'] ?? '') === '12:00' && $noonCountdown === null) {
                $noonCountdown = $index;
            }
            if (str_contains((string) ($row['title'] ?? ''), 'LOUVOR 1')) {
                $afternoonPraise = $index;
            }
        }

        $this->assertIsInt($conviva);
        $this->assertIsInt($lesson);
        $this->assertIsInt($interval);
        $this->assertIsInt($second);
        $this->assertIsInt($noonCountdown);
        $this->assertLessThan($lesson, $conviva);
        $this->assertLessThan($interval, $lesson);
        $this->assertLessThan($second, $interval);
        $this->assertLessThan($noonCountdown, $second);
        $this->assertLessThan($afternoonPraise, $second);

        foreach ($items as $index => $row) {
            if (($row['kind'] ?? '') !== 'item') {
                continue;
            }
            $start = (string) ($row['start'] ?? '');
            if (preg_match('/^(\d{1,2}):(\d{2})/', $start, $m) && ((int) $m[1]) * 60 + (int) $m[2] >= 12 * 60) {
                $this->assertGreaterThan($second, $index, $start.' '.$row['title']);
            }
        }
    }

    #[Test]
    public function it_places_the_sample_pdf_second_service_before_noon(): void
    {
        $items = (new SaturdayProgramPdfParser)->parseFile(
            base_path('tests/fixtures/saturday-program-sample.pdf'),
        )['items'];

        $second = null;
        $lesson = null;
        foreach ($items as $index => $row) {
            $title = (string) ($row['title'] ?? '');
            if ($second === null && ($row['kind'] ?? '') === 'section' && $title === '2º CULTO') {
                $second = $index;
            }
            if ($lesson === null && ($row['kind'] ?? '') === 'item' && str_contains(mb_strtoupper($title), 'LIÇÃO')) {
                $lesson = $index;
            }
        }

        $this->assertIsInt($second);
        $this->assertIsInt($lesson);
        $this->assertLessThan($second, $lesson);

        foreach ($items as $index => $row) {
            if (($row['kind'] ?? '') !== 'item') {
                continue;
            }
            $start = (string) ($row['start'] ?? '');
            if (preg_match('/^(\d{1,2}):(\d{2})/', $start, $m) && ((int) $m[1]) * 60 + (int) $m[2] >= 12 * 60) {
                $this->assertGreaterThan($second, $index);
            }
        }
    }
}
