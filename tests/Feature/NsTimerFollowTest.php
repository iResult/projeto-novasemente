<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NsTimerFollowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config([
            'nstimer.origin' => 'https://nstimer.novasemente.com.br',
            'nstimer.live_cache_seconds' => 8,
        ]);
    }

    public function test_guest_can_view_the_schedule_without_login(): void
    {
        Http::fake([
            'https://nstimer.novasemente.com.br/_api/schedule/live' => Http::response($this->pendingBody(), 500),
        ]);

        $this->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/AcompanharCulto')
                ->where('follow.available', true)
                ->where('follow.title', 'CULTO DE SÁBADO')
                ->missing('follow.sections.0.stages.0.notes'));

        $this->getJson(route('mobile.acompanhar-culto.live'))
            ->assertOk()
            ->assertJsonPath('available', true)
            ->assertJsonMissingPath('sections.0.stages.0.notes');
    }

    public function test_pending_schedule_is_shown_from_error_body_without_operator_fields(): void
    {
        Http::fake([
            'https://nstimer.novasemente.com.br/_api/schedule/live' => Http::response($this->pendingBody(), 500),
        ]);

        $user = $this->member();

        $this->actingAs($user)
            ->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/AcompanharCulto')
                ->where('follow.available', true)
                ->where('follow.live', false)
                ->where('follow.status', 'ready')
                ->where('follow.status_label', 'Pendente')
                ->where('follow.title', 'CULTO DE SÁBADO')
                ->where('follow.start_time', '08:00')
                ->where('follow.date_label', 'Sábado, 24 de outubro de 2026')
                ->where('follow.stage_count', 2)
                ->where('follow.current_stage_name', null)
                ->where('follow.team.0.label', 'Produção')
                ->where('follow.team.0.value', 'Marcella')
                ->where('follow.team.1.label', 'Técnico de Áudio')
                ->where('follow.team.1.value', 'Thiago')
                ->where('follow.sections.0.title', 'PRÉ ABERTURA')
                ->where('follow.sections.0.stages.0.name', 'TESTE DE SOM')
                ->where('follow.sections.0.stages.0.start_time', '08:00')
                ->where('follow.sections.0.stages.0.duration_label', '60 min')
                ->where('follow.sections.0.stages.0.state', 'upcoming')
                ->where('follow.sections.0.stages.1.start_time', '09:00')
                ->where('follow.sections.0.stages.1.duration_label', '1 min')
                ->missing('follow.sections.0.stages.0.notes')
                ->missing('follow.sections.0.stages.0.proPresenterActionConfig'))
            ->assertDontSee('nao-vazar', false)
            ->assertDontSee('uuid-secreto', false)
            ->assertDontSee('controllerUserId', false);

        $this->actingAs($user)
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Home')
                ->missing('nsTimerFollow'));

        $this->actingAs($user)
            ->getJson(route('mobile.acompanhar-culto.live'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('available', true)
            ->assertJsonPath('sections.0.stages.0.start_time', '08:00')
            ->assertJsonMissingPath('sections.0.stages.0.notes')
            ->assertJsonMissingPath('sections.0.stages.0.proPresenterActionConfig');

        $this->assertCount(1, Http::recorded(
            fn ($request): bool => str_contains($request->url(), '/_api/schedule/live'),
        ));
    }

    public function test_live_schedule_marks_the_current_stage(): void
    {
        Http::fake([
            'https://nstimer.novasemente.com.br/_api/schedule/live' => Http::response($this->liveBody(), 200),
        ]);

        $this->actingAs($this->member())
            ->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('follow.live', true)
                ->where('follow.status_label', 'Ao vivo')
                ->where('follow.current_stage_name', 'ABERTURA DAS PORTAS')
                ->where('follow.sections.0.stages.0.state', 'done')
                ->where('follow.sections.0.stages.1.state', 'current')
                ->where('follow.sections.0.stages.1.start_time', '09:00'))
            ->assertDontSee('nao-vazar', false)
            ->assertDontSee('controllerUserId', false);
    }

    public function test_public_payload_hides_backstage_notes_and_selected_speakers(): void
    {
        Http::fake([
            'https://nstimer.novasemente.com.br/_api/schedule/live' => Http::response([
                'json' => [
                    'schedule' => null,
                    'stages' => [],
                    'currentStage' => null,
                    'nextStage' => null,
                    'upcomingSchedule' => [
                        'id' => 18,
                        'title' => 'CULTO DE SÁBADO',
                        'scheduleDate' => '2026-10-24T03:00:00.000Z',
                        'status' => 'ready',
                        'startTime' => '10:00:00',
                        'introduction' => null,
                        'notes' => null,
                    ],
                    'upcomingStages' => [
                        $this->stage(1, 'LOUVOR 3: Agradeço', 300, 0, 'Produção: posicionar a mesinha no palco', 'Banda | Louvor', 'LOUVOR'),
                        $this->stage(2, 'ORAÇÃO', 120, 1, 'Produção: retirar o pedestal', 'Pr. Igor Oração', '1º CULTO'),
                        $this->stage(3, 'MENSAGEM', 2400, 2, 'Produção: no final da mensagem, retirar a mesinha.', 'Pr. Igor Mensagem', '1º CULTO'),
                        $this->stage(4, 'ORAÇÃO FINAL', 120, 3, 'Produção: bastidores da oração final', 'Pr. Igor Final', '1º CULTO'),
                        $this->stage(5, 'ORIENTAÇÕES DE SAÍDA', 120, 4, 'Produção: abrir as portas', 'Diácono Saída', '1º CULTO'),
                        $this->stage(6, 'ORAÇÃO', 120, 5, 'Produção: oração do segundo culto', 'Pr. Igor Segundo', '2º CULTO'),
                        $this->stage(7, 'ORIENTAÇÕES DE SAÍDA', 120, 6, 'Produção: saída do segundo culto', 'Diácono Segundo', '2º CULTO'),
                        $this->stage(8, 'INSTRUMENTAL DE ENCERRAMENTO', 180, 7, 'Produção: instrumental', 'Banda', 'ORIENTAÇÕES DE SAÍDA'),
                    ],
                ],
            ], 200),
        ]);

        $user = $this->member();

        $this->actingAs($user)
            ->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('follow.sections.0.stages.0.name', 'LOUVOR 3: Agradeço')
                ->where('follow.sections.0.stages.0.responsible', 'Banda | Louvor')
                ->missing('follow.sections.0.stages.0.notes')
                ->where('follow.sections.1.title', '1º CULTO')
                ->where('follow.sections.1.stages.0.name', 'ORAÇÃO')
                ->where('follow.sections.1.stages.0.responsible', null)
                ->missing('follow.sections.1.stages.0.notes')
                ->where('follow.sections.1.stages.1.name', 'MENSAGEM')
                ->where('follow.sections.1.stages.1.responsible', null)
                ->where('follow.sections.1.stages.2.name', 'ORAÇÃO FINAL')
                ->where('follow.sections.1.stages.2.responsible', null)
                ->where('follow.sections.1.stages.3.name', 'ORIENTAÇÕES DE SAÍDA')
                ->where('follow.sections.1.stages.3.responsible', null)
                ->where('follow.sections.2.title', '2º CULTO')
                ->where('follow.sections.2.stages.0.name', 'ORAÇÃO')
                ->where('follow.sections.2.stages.0.responsible', null)
                ->where('follow.sections.2.stages.1.name', 'ORIENTAÇÕES DE SAÍDA')
                ->where('follow.sections.2.stages.1.responsible', null)
                ->where('follow.sections.3.stages.0.name', 'INSTRUMENTAL DE ENCERRAMENTO')
                ->where('follow.sections.3.stages.0.responsible', 'Banda')
                ->missing('follow.sections.0.stages.0.proPresenterActionConfig'))
            ->assertDontSee('posicionar a mesinha', false)
            ->assertDontSee('Pr. Igor Oração', false)
            ->assertDontSee('Pr. Igor Mensagem', false)
            ->assertDontSee('Pr. Igor Final', false)
            ->assertDontSee('Pr. Igor Segundo', false)
            ->assertDontSee('Diácono Saída', false)
            ->assertDontSee('Diácono Segundo', false)
            ->assertDontSee('nao-vazar', false);

        $this->actingAs($user)
            ->getJson(route('mobile.acompanhar-culto.live'))
            ->assertOk()
            ->assertJsonPath('sections.0.stages.0.responsible', 'Banda | Louvor')
            ->assertJsonPath('sections.1.stages.0.responsible', null)
            ->assertJsonPath('sections.1.stages.1.responsible', null)
            ->assertJsonPath('sections.1.stages.2.responsible', null)
            ->assertJsonPath('sections.1.stages.3.responsible', null)
            ->assertJsonPath('sections.2.stages.0.responsible', null)
            ->assertJsonPath('sections.2.stages.1.responsible', null)
            ->assertJsonPath('sections.3.stages.0.responsible', 'Banda')
            ->assertJsonMissingPath('sections.0.stages.0.notes')
            ->assertJsonMissingPath('sections.1.stages.0.notes')
            ->assertDontSee('posicionar a mesinha', false)
            ->assertDontSee('Pr. Igor Oração', false)
            ->assertDontSee('Diácono Saída', false)
            ->assertDontSee('Diácono Segundo', false);
    }

    public function test_network_failure_stays_empty_and_keeps_the_home(): void
    {
        Http::fake(function () {
            throw new ConnectionException('offline');
        });

        $user = $this->member();

        $this->actingAs($user)
            ->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('follow.available', false));

        $this->actingAs($user)
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Home')
                ->missing('nsTimerFollow'));
    }

    public function test_disabled_feature_hides_the_screen_and_does_not_call_ns_timer(): void
    {
        Http::fake();
        $church = $this->church();
        $church->update(['disabled_app_features' => ['acompanhar_culto']]);

        $this->actingAs($this->member($church))
            ->get(route('mobile.acompanhar-culto'))
            ->assertNotFound();

        $this->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->missing('nsTimerFollow'));

        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), 'nstimer.novasemente.com.br'));
    }

    public function test_unsafe_origin_is_not_called(): void
    {
        config(['nstimer.origin' => 'https://user:segredo@nstimer.novasemente.com.br']);
        Http::fake();

        $this->actingAs($this->member())
            ->get(route('mobile.acompanhar-culto'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('follow.available', false))
            ->assertDontSee('segredo', false);

        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), 'nstimer'));
    }

    private function member(?Church $church = null): User
    {
        $church ??= $this->church();

        return User::factory()->create([
            'church_id' => $church->id,
            'name' => 'Membro',
            'email' => 'membro-acompanhar@novasemente.com.br',
        ]);
    }

    private function church(): Church
    {
        return Church::query()->create([
            'name' => 'Nova Semente',
            'slug' => 'nova-semente-acompanhar',
            'active' => true,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function pendingBody(): array
    {
        return [
            'json' => [
                'schedule' => null,
                'stages' => [],
                'currentStage' => null,
                'nextStage' => null,
                'upcomingSchedule' => [
                    'id' => 17,
                    'title' => 'CULTO DE SÁBADO',
                    'scheduleDate' => '2026-10-24T03:00:00.000Z',
                    'status' => 'ready',
                    'startTime' => '08:00:00',
                    'introduction' => "Produção: Marcella\nTécnico de Áudio: Thiago",
                    'notes' => null,
                    'controllerUserId' => 9,
                    'startedBy' => 2,
                ],
                'upcomingStages' => [
                    $this->stage(297, 'TESTE DE SOM', 3600, 0, 'Ensaio'),
                    $this->stage(298, 'ABERTURA DAS PORTAS', 60, 1, ''),
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function liveBody(): array
    {
        return [
            'json' => [
                'schedule' => [
                    'id' => 17,
                    'title' => 'CULTO DE SÁBADO',
                    'scheduleDate' => '2026-10-24T03:00:00.000Z',
                    'status' => 'live',
                    'startTime' => '08:00:00',
                    'introduction' => null,
                    'notes' => null,
                    'controllerUserId' => 9,
                    'startedBy' => 2,
                ],
                'stages' => [
                    $this->stage(297, 'TESTE DE SOM', 3600, 0, ''),
                    $this->stage(298, 'ABERTURA DAS PORTAS', 60, 1, ''),
                ],
                'currentStage' => ['id' => 298, 'name' => 'ABERTURA DAS PORTAS'],
                'nextStage' => null,
                'upcomingSchedule' => null,
                'upcomingStages' => [],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function stage(
        int $id,
        string $name,
        int $duration,
        int $order,
        string $notes,
        string $responsible = 'Diaconato',
        string $section = 'PRÉ ABERTURA',
    ): array {
        return [
            'id' => $id,
            'name' => $name,
            'durationSeconds' => $duration,
            'orderIndex' => $order,
            'responsible' => $responsible,
            'notes' => $notes,
            'section' => $section,
            'proPresenterActionType' => 'none',
            'proPresenterActionConfig' => ['secret' => 'nao-vazar'],
            'proPresenterTargetUuid' => 'uuid-secreto',
        ];
    }
}
