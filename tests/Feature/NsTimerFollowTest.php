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

    public function test_guest_is_sent_to_login(): void
    {
        $this->get(route('mobile.acompanhar-culto'))
            ->assertRedirect(route('login'));
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
                ->missing('follow.sections.0.stages.0.proPresenterActionConfig'))
            ->assertDontSee('nao-vazar', false)
            ->assertDontSee('uuid-secreto', false)
            ->assertDontSee('controllerUserId', false);

        $this->actingAs($user)
            ->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Home')
                ->where('nsTimerFollow.title', 'CULTO DE SÁBADO')
                ->where('nsTimerFollow.live', false)
                ->where('nsTimerFollow.status_label', 'Pendente')
                ->where('nsTimerFollow.start_time', '08:00')
                ->missing('nsTimerFollow.sections'));

        $this->actingAs($user)
            ->getJson(route('mobile.acompanhar-culto.live'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('available', true)
            ->assertJsonPath('sections.0.stages.0.start_time', '08:00')
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

        $this->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('nsTimerFollow.live', true)
                ->where('nsTimerFollow.current_stage_name', 'ABERTURA DAS PORTAS'));
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
                ->where('nsTimerFollow', null));
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
            ->assertInertia(fn (Assert $page) => $page->where('nsTimerFollow', null));

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
    private function stage(int $id, string $name, int $duration, int $order, string $notes): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'durationSeconds' => $duration,
            'orderIndex' => $order,
            'responsible' => 'Diaconato',
            'notes' => $notes,
            'section' => 'PRÉ ABERTURA',
            'proPresenterActionType' => 'none',
            'proPresenterActionConfig' => ['secret' => 'nao-vazar'],
            'proPresenterTargetUuid' => 'uuid-secreto',
        ];
    }
}
