<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Leitura somente do acompanhamento público do NS Timer.
 * O app não opera o timer: só espelha o que /acompanhamento já mostra.
 */
final class NsTimerLiveService
{
    private const STATUS_LABELS = [
        'live' => 'Ao vivo',
        'ready' => 'Pendente',
        'completed' => 'Concluído',
        'archived' => 'Arquivado',
        'draft' => 'Rascunho',
    ];

    /** @var array<string, string> */
    private const TEAM_FIELDS = [
        'producao' => 'Produção',
        'diaconato' => 'Diaconato',
        'audio' => 'Técnico de Áudio',
        'midia' => 'Mídia Center e Operação de Vídeo',
        'cameras' => 'Câmeras',
        'fotografia' => 'Fotografia',
    ];

    /** @var array<string, string> */
    private const TEAM_ALIASES = [
        'producao' => 'producao',
        'diaconato' => 'diaconato',
        'tecnico de audio' => 'audio',
        'midia center e operacao de video' => 'midia',
        'midia center' => 'midia',
        'cameras' => 'cameras',
        'camera' => 'cameras',
        'fotografia' => 'fotografia',
    ];

    /**
     * @return array{available: false}|array<string, mixed>
     */
    public function payload(): array
    {
        $origin = $this->origin();
        if ($origin === null) {
            return $this->unavailable();
        }

        $ttl = max(1, min(60, (int) config('nstimer.live_cache_seconds', 8)));

        /** @var array{available: false}|array<string, mixed> $payload */
        $payload = Cache::remember($this->cacheKey($origin), $ttl, function () use ($origin): array {
            return $this->fetch($origin);
        });

        return $payload;
    }

    /**
     * @return array{available: false}|array<string, mixed>
     */
    private function fetch(string $origin): array
    {
        $path = (string) config('nstimer.live_path', '/_api/schedule/live');
        if (! str_starts_with($path, '/') || str_contains($path, '://')) {
            return $this->unavailable();
        }

        try {
            $response = Http::withOptions(['allow_redirects' => false])
                ->connectTimeout(2)
                ->timeout(4)
                ->acceptJson()
                ->get($origin.$path);
        } catch (ConnectionException) {
            return $this->unavailable();
        }

        $decoded = json_decode($response->body(), true);
        $data = $this->unwrap($decoded);
        if ($data === null) {
            return $this->unavailable();
        }

        return $this->normalize($data);
    }

    /**
     * @return array{available: false}
     */
    private function unavailable(): array
    {
        return ['available' => false];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{available: false}|array<string, mixed>
     */
    private function normalize(array $data): array
    {
        $selected = $this->selectSchedule($data);
        if ($selected === null) {
            return $this->unavailable();
        }

        $schedule = $selected['schedule'];
        $title = $this->clip(trim((string) ($schedule['title'] ?? '')), 200);
        if ($title === '') {
            return $this->unavailable();
        }

        $status = is_string($schedule['status'] ?? null) ? $schedule['status'] : 'ready';
        if (! array_key_exists($status, self::STATUS_LABELS)) {
            $status = 'ready';
        }

        $live = $status === 'live';
        $currentId = null;
        if ($live && is_array($selected['current'])) {
            $rawId = $selected['current']['id'] ?? null;
            if (is_int($rawId) || (is_string($rawId) && ctype_digit($rawId))) {
                $currentId = (int) $rawId;
            }
        }

        $startSeconds = $this->timeToSeconds((string) ($schedule['startTime'] ?? ''));
        $built = $this->buildSections($selected['stages'], $startSeconds, $currentId, $live);

        return [
            'available' => true,
            'live' => $live,
            'title' => $title,
            'status' => $status,
            'status_label' => self::STATUS_LABELS[$status],
            'date_label' => $this->dateLabel($schedule['scheduleDate'] ?? null),
            'start_time' => $startSeconds === null ? '' : $this->clock($startSeconds),
            'stage_count' => $built['count'],
            'current_stage_name' => $built['current_name'],
            'team' => $this->teamRows(
                is_string($schedule['introduction'] ?? null) ? $schedule['introduction'] : null,
                is_string($schedule['notes'] ?? null) ? $schedule['notes'] : null,
            ),
            'sections' => $built['sections'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{schedule: array<string, mixed>, stages: list<mixed>, current: mixed}|null
     */
    private function selectSchedule(array $data): ?array
    {
        $schedule = $data['schedule'] ?? null;
        if (is_array($schedule) && trim((string) ($schedule['title'] ?? '')) !== '') {
            $stages = $data['stages'] ?? [];

            return [
                'schedule' => $schedule,
                'stages' => is_array($stages) ? array_values($stages) : [],
                'current' => $data['currentStage'] ?? null,
            ];
        }

        $upcoming = $data['upcomingSchedule'] ?? null;
        if (is_array($upcoming) && trim((string) ($upcoming['title'] ?? '')) !== '') {
            $stages = $data['upcomingStages'] ?? [];

            return [
                'schedule' => $upcoming,
                'stages' => is_array($stages) ? array_values($stages) : [],
                'current' => null,
            ];
        }

        return null;
    }

    /**
     * @param  list<mixed>  $stages
     * @return array{count: int, current_name: string|null, sections: list<array{title: string|null, stages: list<array<string, mixed>>}>}
     */
    private function buildSections(array $stages, ?int $startSeconds, ?int $currentId, bool $live): array
    {
        $rows = [];
        foreach ($stages as $stage) {
            if (! is_array($stage)) {
                continue;
            }
            $name = $this->clip(trim((string) ($stage['name'] ?? '')), 200);
            if ($name === '') {
                continue;
            }
            $id = $stage['id'] ?? null;
            $rows[] = [
                'id' => is_int($id) || (is_string($id) && ctype_digit($id)) ? (int) $id : count($rows) + 1,
                'name' => $name,
                'duration' => max(0, (int) ($stage['durationSeconds'] ?? 0)),
                'order' => (int) ($stage['orderIndex'] ?? count($rows)),
                'responsible' => $this->publicResponsible($name, $stage['responsible'] ?? null),
                'section' => $this->nullableClip($stage['section'] ?? null, 120),
            ];
            if (count($rows) >= 400) {
                break;
            }
        }

        usort($rows, static fn (array $a, array $b): int => $a['order'] <=> $b['order']);

        $currentOrder = null;
        if ($currentId !== null) {
            foreach ($rows as $row) {
                if ($row['id'] === $currentId) {
                    $currentOrder = $row['order'];
                    break;
                }
            }
        }

        $cursor = $startSeconds;
        $sections = [];
        $currentName = null;

        foreach ($rows as $row) {
            $state = 'upcoming';
            if ($live && $currentOrder !== null) {
                if ($row['order'] < $currentOrder) {
                    $state = 'done';
                } elseif ($row['id'] === $currentId) {
                    $state = 'current';
                    $currentName = $row['name'];
                }
            }

            $item = [
                'id' => $row['id'],
                'name' => $row['name'],
                'start_time' => $cursor === null ? null : $this->clock($cursor),
                'duration_label' => $this->durationLabel($row['duration']),
                'responsible' => $row['responsible'],
                'state' => $state,
            ];

            if ($cursor !== null) {
                $cursor += $row['duration'];
            }

            $title = $row['section'];
            $last = $sections === [] ? null : array_key_last($sections);
            if ($last === null || $sections[$last]['title'] !== $title) {
                $sections[] = ['title' => $title, 'stages' => []];
                $last = array_key_last($sections);
            }
            $sections[$last]['stages'][] = $item;
        }

        return [
            'count' => count($rows),
            'current_name' => $currentName,
            'sections' => $sections,
        ];
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    private function teamRows(?string $introduction, ?string $notes): array
    {
        $parts = array_values(array_filter(
            [trim((string) $introduction), trim((string) $notes)],
            static fn (string $value): bool => $value !== '',
        ));
        $source = trim(implode("\n", $parts));
        if ($source === '') {
            return [];
        }

        $fields = array_fill_keys(array_keys(self::TEAM_FIELDS), '');
        $current = null;
        $leftover = [];

        foreach (preg_split("/\n/", $source) ?: [] as $line) {
            $line = trim((string) $line);
            if ($line === '') {
                $current = null;

                continue;
            }

            $matched = $this->matchTeamLabel($line);
            if ($matched !== null) {
                $current = $matched['label_only'] ? $matched['key'] : null;
                if ($matched['value'] !== '') {
                    $fields[$matched['key']] = $this->appendTeam($fields[$matched['key']], $matched['value']);
                }

                continue;
            }

            if (is_string($current) && isset($fields[$current])) {
                $fields[$current] = $this->appendTeam($fields[$current], $line);

                continue;
            }

            $leftover[] = $line;
        }

        $rows = [];
        foreach (self::TEAM_FIELDS as $key => $label) {
            $value = $this->oneLine($fields[$key]);
            if ($value !== '') {
                $rows[] = ['label' => $label, 'value' => $value];
            }
        }

        foreach ($leftover as $line) {
            $colon = mb_strpos($line, ':');
            if ($colon !== false && $colon > 0 && $colon <= 42) {
                $label = trim(mb_substr($line, 0, $colon));
                $value = trim(mb_substr($line, $colon + 1));
                if ($label !== '' && $value !== '') {
                    $rows[] = ['label' => $label, 'value' => $value];
                }

                continue;
            }

            $rows[] = ['label' => '', 'value' => $line];
        }

        return $rows;
    }

    /**
     * @return array{key: string, value: string, label_only: bool}|null
     */
    private function matchTeamLabel(string $line): ?array
    {
        $colon = mb_strpos($line, ':');
        $label = $colon === false ? $line : mb_substr($line, 0, $colon);
        $folded = $this->fold($label);
        if ($folded === '' || mb_strlen($folded) > 60) {
            return null;
        }

        $key = self::TEAM_ALIASES[$folded] ?? null;
        if ($key === null) {
            return null;
        }

        return [
            'key' => $key,
            'value' => $colon === false ? '' : trim(mb_substr($line, $colon + 1)),
            'label_only' => $colon === false,
        ];
    }

    private function appendTeam(string $current, string $extra): string
    {
        $extra = trim($extra);
        if ($extra === '') {
            return $current;
        }

        return trim($current) === '' ? $extra : trim($current)."\n".$extra;
    }

    private function oneLine(string $value): string
    {
        $parts = array_values(array_filter(
            array_map(static fn (string $line): string => trim($line), preg_split("/\n+/", $value) ?: []),
            static fn (string $line): bool => $line !== '',
        ));

        return implode(' | ', $parts);
    }

    /**
     * Notas de bastidores nunca saem. O responsável some em Mensagem e Oração Final.
     */
    private function publicResponsible(string $name, mixed $responsible): ?string
    {
        if ($this->hidesPublicResponsible($name)) {
            return null;
        }

        return $this->nullableClip($responsible, 200);
    }

    private function hidesPublicResponsible(string $name): bool
    {
        $folded = $this->fold($name);

        return $folded === 'mensagem'
            || str_starts_with($folded, 'mensagem ')
            || $folded === 'oracao final'
            || str_starts_with($folded, 'oracao final ');
    }

    private function fold(string $value): string
    {
        $ascii = Str::lower(Str::ascii($value));
        $ascii = preg_replace('/[^a-z0-9]+/', ' ', $ascii) ?? '';

        return trim($ascii);
    }

    private function dateLabel(mixed $raw): string
    {
        if (! is_string($raw) || trim($raw) === '') {
            return '';
        }

        try {
            $tz = (string) config('sabbath.timezone', 'America/Sao_Paulo');
            $moment = Carbon::parse($raw)->timezone($tz);
        } catch (\Throwable) {
            return '';
        }

        if (class_exists(\IntlDateFormatter::class)) {
            $formatter = new \IntlDateFormatter(
                'pt_BR',
                \IntlDateFormatter::FULL,
                \IntlDateFormatter::NONE,
                $moment->timezoneName,
                \IntlDateFormatter::GREGORIAN,
                "EEEE, d 'de' MMMM 'de' y",
            );
            $formatted = $formatter->format($moment->toDateTime());
            if (is_string($formatted) && $formatted !== '') {
                return mb_strtoupper(mb_substr($formatted, 0, 1), 'UTF-8').mb_substr($formatted, 1);
            }
        }

        return $moment->locale('pt_BR')->isoFormat('dddd, D [de] MMMM [de] YYYY');
    }

    private function durationLabel(int $seconds): ?string
    {
        if ($seconds <= 0) {
            return null;
        }

        if ($seconds < 60) {
            return $seconds.' s';
        }

        return ((int) round($seconds / 60)).' min';
    }

    private function clock(int $seconds): string
    {
        $seconds %= 86400;
        if ($seconds < 0) {
            $seconds += 86400;
        }

        return sprintf('%02d:%02d', intdiv($seconds, 3600), intdiv($seconds % 3600, 60));
    }

    private function timeToSeconds(string $value): ?int
    {
        if (! preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', trim($value), $matches)) {
            return null;
        }

        $hour = (int) $matches[1];
        $minute = (int) $matches[2];
        $second = isset($matches[3]) ? (int) $matches[3] : 0;
        if ($hour > 23 || $minute > 59 || $second > 59) {
            return null;
        }

        return ($hour * 3600) + ($minute * 60) + $second;
    }

    private function nullableClip(mixed $value, int $max): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = $this->clip(trim($value), $max);

        return $trimmed === '' ? null : $trimmed;
    }

    private function clip(string $value, int $max): string
    {
        if (mb_strlen($value) <= $max) {
            return $value;
        }

        return mb_substr($value, 0, $max);
    }

    private function unwrap(mixed $decoded): ?array
    {
        if (! is_array($decoded)) {
            return null;
        }

        if (isset($decoded['json']) && is_array($decoded['json'])) {
            return $decoded['json'];
        }

        if (array_key_exists('schedule', $decoded) || array_key_exists('upcomingSchedule', $decoded)) {
            return $decoded;
        }

        return null;
    }

    private function origin(): ?string
    {
        $configured = trim((string) config('nstimer.origin'));
        if ($configured === '') {
            return null;
        }

        $parts = parse_url($configured);
        if (! is_array($parts)) {
            return null;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = (string) ($parts['host'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':'.(int) $parts['port'] : '';

        return $scheme.'://'.$host.$port;
    }

    private function cacheKey(string $origin): string
    {
        return 'nstimer.live.'.sha1($origin.'|'.(string) config('nstimer.live_path'));
    }
}
