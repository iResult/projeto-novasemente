<?php

namespace App\Services;

use App\Models\SaturdayProgram;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class SaturdayProgramService
{
    public const EXPIRE_HOUR = 15;

    public const WAITING_MESSAGE = 'Aguarde a publicação do próximo sábado.';

    public function __construct(
        private readonly SaturdayProgramPdfParser $pdfParser,
    ) {}

    public function timezone(): string
    {
        return (string) config('app.timezone', 'America/Sao_Paulo');
    }

    public function expiresAt(Carbon|string $saturdayDate, ?string $timezone = null): Carbon
    {
        $tz = $timezone ?? $this->timezone();

        return Carbon::parse($saturdayDate, $tz)->startOfDay()->setTime(self::EXPIRE_HOUR, 0, 0);
    }

    public function isWithinWindow(SaturdayProgram $program, ?Carbon $now = null): bool
    {
        if (! $program->is_active) {
            return false;
        }

        if ($program->published_at === null) {
            return false;
        }

        $tz = $this->timezone();
        $now ??= now($tz);

        if ($now->lt(Carbon::parse($program->published_at)->timezone($tz))) {
            return false;
        }

        return $now->lt($this->expiresAt($program->saturday_date, $tz));
    }

    public function hasPassedExpiry(SaturdayProgram $program, ?Carbon $now = null): bool
    {
        $tz = $this->timezone();
        $now ??= now($tz);

        return $now->gte($this->expiresAt($program->saturday_date, $tz));
    }

    public function currentForChurch(?int $churchId): ?SaturdayProgram
    {
        if ($churchId === null) {
            return null;
        }

        $now = now($this->timezone());

        return SaturdayProgram::query()
            ->where('church_id', $churchId)
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', $now)
            ->orderBy('saturday_date')
            ->orderBy('id')
            ->get()
            ->first(fn (SaturdayProgram $program) => $this->isWithinWindow($program, $now));
    }

    /**
     * @return array{
     *     status: string,
     *     message?: string,
     *     id?: int,
     *     title?: string,
     *     saturday_date?: string,
     *     pdf_url?: string|null,
     *     pdf_download_url?: string|null,
     *     parse_status?: string,
     *     has_schedule?: bool,
     *     schedule?: array<string, mixed>|null,
     *     live_current_index?: int|null,
     *     live_updated_at?: string|null,
     *     can_conduct?: bool
     * }
     */
    public function mobilePayload(?int $churchId, bool $canConduct = false): array
    {
        $program = $this->currentForChurch($churchId);

        if ($program === null) {
            return [
                'status' => 'waiting',
                'message' => self::WAITING_MESSAGE,
            ];
        }

        $program = $this->ensureScheduleParsed($program);

        $title = trim((string) ($program->title ?? ''));
        if ($title === '') {
            $title = 'Programação do Sábado';
        }

        $schedule = is_array($program->schedule) ? $program->schedule : null;
        $hasSchedule = $this->hasUsableSchedule($program);

        $pdfPath = is_string($program->pdf_path) ? trim($program->pdf_path) : '';
        $pdfUrl = null;
        $pdfDownloadUrl = null;
        if ($pdfPath !== '') {
            // Relativo ao host atual (evita 404 quando APP_URL ≠ origem do app/Capacitor).
            $pdfUrl = route('media.public', ['path' => $pdfPath], absolute: false);
            $pdfDownloadUrl = route('mobile.programacao-sabado.pdf-download', absolute: false);
        }

        if (! $hasSchedule && $pdfUrl === null) {
            return [
                'status' => 'waiting',
                'message' => self::WAITING_MESSAGE,
            ];
        }

        return [
            'status' => 'available',
            'id' => $program->id,
            'title' => $title,
            'saturday_date' => $program->saturday_date?->toDateString(),
            'pdf_url' => $pdfUrl,
            'pdf_download_url' => $pdfDownloadUrl,
            'parse_status' => $program->parse_status ?? SaturdayProgram::PARSE_PENDING,
            'has_schedule' => $hasSchedule,
            'schedule' => $hasSchedule ? $schedule : null,
            ...$this->livePublicState($program),
            'can_conduct' => $canConduct && $hasSchedule,
        ];
    }

    /**
     * @return array{live_current_index: int|null, live_updated_at: string|null, live_active: bool}
     */
    public function livePublicState(SaturdayProgram $program): array
    {
        $index = $program->live_current_index;
        $index = $index === null ? null : (int) $index;

        return [
            'live_current_index' => $index,
            'live_updated_at' => $program->live_updated_at
                ?->timezone($this->timezone())
                ->toIso8601String(),
            'live_active' => $index !== null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function scheduleItems(SaturdayProgram $program): array
    {
        $schedule = is_array($program->schedule) ? $program->schedule : [];
        $items = $schedule['items'] ?? [];

        return is_array($items) ? array_values($items) : [];
    }

    public function setLiveCurrentIndex(SaturdayProgram $program, ?int $index): SaturdayProgram
    {
        if ($index === null) {
            $program->forceFill([
                'live_current_index' => null,
                'live_updated_at' => now($this->timezone()),
            ])->save();

            return $program->refresh();
        }

        $items = $this->scheduleItems($program);
        $max = count($items);
        if ($index < 0 || $index > $max) {
            throw ValidationException::withMessages([
                'live_current_index' => 'Item da programação inválido.',
            ]);
        }

        if ($index < $max && ($items[$index]['kind'] ?? '') !== 'item') {
            $snapped = $this->nextItemIndex($items, $index - 1);
            $index = $snapped ?? $max;
        }

        $program->forceFill([
            'live_current_index' => $index,
            'live_updated_at' => now($this->timezone()),
        ])->save();

        return $program->refresh();
    }

    public function clearLiveCursor(SaturdayProgram $program): void
    {
        $program->forceFill([
            'live_current_index' => null,
            'live_updated_at' => null,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    public function nextItemIndex(array $items, int $fromIndex): ?int
    {
        $n = count($items);
        for ($i = $fromIndex + 1; $i < $n; $i++) {
            if (($items[$i]['kind'] ?? '') === 'item') {
                return $i;
            }
        }

        return null;
    }

    public function hasUsableSchedule(SaturdayProgram $program): bool
    {
        $schedule = is_array($program->schedule) ? $program->schedule : null;

        return $program->parse_status === SaturdayProgram::PARSE_OK
            && is_array($schedule)
            && is_array($schedule['items'] ?? null)
            && $schedule['items'] !== [];
    }

    /**
     * Captura (ou recaptura) a lista formatada a partir do PDF quando ainda não está ok.
     */
    public function ensureScheduleParsed(SaturdayProgram $program): SaturdayProgram
    {
        if ($this->hasUsableSchedule($program)) {
            return $program;
        }

        // Falhas permanentes: o comando de deploy recaptura. No app só tenta se ainda pendente.
        $status = $program->parse_status ?? SaturdayProgram::PARSE_PENDING;
        if ($status === SaturdayProgram::PARSE_FAILED) {
            return $program;
        }

        $pdfPath = is_string($program->pdf_path) ? trim($program->pdf_path) : '';
        if ($pdfPath === '' || ! Storage::disk('public')->exists($pdfPath)) {
            return $program;
        }

        return $this->parseAndPersist($program, $pdfPath);
    }

    /**
     * Recaptura forçada (admin / comando).
     */
    public function reparseFromDisk(SaturdayProgram $program): SaturdayProgram
    {
        $pdfPath = is_string($program->pdf_path) ? trim($program->pdf_path) : '';
        if ($pdfPath === '' || ! Storage::disk('public')->exists($pdfPath)) {
            $program->forceFill([
                'schedule' => null,
                'parse_status' => SaturdayProgram::PARSE_FAILED,
                'parsed_at' => now($this->timezone()),
                'parse_error' => 'PDF não encontrado no disco.',
            ]);
            $this->clearLiveCursor($program);
            $program->save();

            return $program->refresh();
        }

        return $this->parseAndPersist($program, $pdfPath);
    }

    private function parseAndPersist(SaturdayProgram $program, string $pdfPathOnPublicDisk): SaturdayProgram
    {
        $absolute = Storage::disk('public')->path($pdfPathOnPublicDisk);

        try {
            $schedule = $this->pdfParser->parseFile($absolute);
            $program->forceFill([
                'schedule' => $schedule,
                'parse_status' => SaturdayProgram::PARSE_OK,
                'parsed_at' => now($this->timezone()),
                'parse_error' => null,
            ]);
            $this->clearLiveCursor($program);
            $program->save();
        } catch (\Throwable $e) {
            report($e);
            $program->forceFill([
                'schedule' => null,
                'parse_status' => SaturdayProgram::PARSE_FAILED,
                'parsed_at' => now($this->timezone()),
                'parse_error' => mb_substr($e->getMessage(), 0, 500),
            ]);
            $this->clearLiveCursor($program);
            $program->save();
        }

        return $program->refresh();
    }

    /**
     * @return array{expired: int, files_deleted: int}
     */
    public function expirePastPrograms(?Carbon $now = null): array
    {
        $tz = $this->timezone();
        $now ??= now($tz);
        $expired = 0;
        $filesDeleted = 0;

        $candidates = SaturdayProgram::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        foreach ($candidates as $program) {
            if (! $this->hasPassedExpiry($program, $now)) {
                continue;
            }

            $path = is_string($program->pdf_path) ? trim($program->pdf_path) : '';
            if ($path !== '' && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                $filesDeleted++;
            }

            $program->update([
                'is_active' => false,
                'pdf_path' => '',
                'schedule' => null,
                'parse_status' => SaturdayProgram::PARSE_PENDING,
                'parsed_at' => null,
                'parse_error' => null,
                'live_current_index' => null,
                'live_updated_at' => null,
            ]);
            $expired++;
        }

        return [
            'expired' => $expired,
            'files_deleted' => $filesDeleted,
        ];
    }

    public function assertSaturdayDate(string $dateYmd): void
    {
        $date = Carbon::parse($dateYmd, $this->timezone())->startOfDay();
        if ($date->dayOfWeek !== Carbon::SATURDAY) {
            throw ValidationException::withMessages([
                'saturday_date' => 'A data deve ser um sábado.',
            ]);
        }
    }
}
