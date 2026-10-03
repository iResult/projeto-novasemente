<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\Ministry;
use App\Models\User;
use App\Support\NsTimerSso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NsTimerSsoTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'segredo-compartilhado-de-teste';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'nstimer.sso_secret' => self::SECRET,
            'nstimer.origin' => 'https://nstimer.novasemente.com.br',
        ]);
    }

    public function test_profile_hides_shortcut_unless_user_belongs_to_programacao(): void
    {
        $church = $this->church();
        $recepcao = $this->ministry($church, 'Recepção');
        $outsider = $this->volunteerIn($church, $recepcao, [
            'name' => 'Fora da Programação',
            'email' => 'fora@novasemente.com.br',
        ]);
        $member = $this->volunteerIn($church, $this->ministry($church, 'Comunicação . Programação'), [
            'name' => 'Nome da Pessoa',
            'email' => 'pessoa@novasemente.com.br',
        ]);

        $this->actingAs($outsider)
            ->get(route('mobile.profile'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Profile')
                ->where('canOpenNsTimer', false))
            ->assertDontSee(self::SECRET, false)
            ->assertDontSee('auth/conecta?token=', false);

        $this->actingAs($member)
            ->get(route('mobile.profile'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('canOpenNsTimer', true))
            ->assertDontSee(self::SECRET, false)
            ->assertDontSee('auth/conecta?token=', false);
    }

    public function test_click_redirects_with_a_short_lived_signed_token(): void
    {
        $church = $this->church();
        $user = $this->volunteerIn($church, $this->ministry($church, 'Comunicação . Programação'), [
            'name' => 'Nome da Pessoa',
            'email' => 'pessoa@novasemente.com.br',
        ]);

        $first = $this->actingAs($user)->get(route('nstimer.sso'));
        $second = $this->actingAs($user)->get(route('nstimer.sso'));

        $firstClaims = $this->assertNsTimerRedirect($first->headers->get('Location'), $user, 'Programação');
        $secondClaims = $this->assertNsTimerRedirect($second->headers->get('Location'), $user, 'Programação');

        $first->assertStatus(302);
        $cacheControl = (string) $first->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('private', $cacheControl);
        $first->assertHeader('Referrer-Policy', 'no-referrer');
        $this->assertNotSame($firstClaims['jti'], $secondClaims['jti']);
        $this->assertNotSame($first->headers->get('Location'), $second->headers->get('Location'));
        $this->assertStringNotContainsString(self::SECRET, (string) $first->headers->get('Location'));
    }

    public function test_local_origin_is_used_when_configured(): void
    {
        config(['nstimer.origin' => 'http://127.0.0.1:3333']);

        $church = $this->church();
        $user = $this->volunteerIn($church, $this->ministry($church, 'Programação'));

        $response = $this->actingAs($user)->get(route('nstimer.sso'));

        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('http://127.0.0.1:3333/auth/conecta?token=', $location);
        $this->assertNsTimerRedirect($location, $user, 'Programação');
    }

    public function test_leader_of_programacao_can_open_without_a_volunteer_link(): void
    {
        $church = $this->church();
        $programacao = $this->ministry($church, 'Comunicação . Programação');
        $user = User::factory()->create([
            'church_id' => $church->id,
            'name' => 'Líder de Programação',
            'email' => 'lider.programacao@novasemente.com.br',
        ]);
        $user->ministries()->attach($programacao->id);

        $this->assertNull($user->volunteerProfile);

        $response = $this->actingAs($user)->get(route('nstimer.sso'));
        $this->assertNsTimerRedirect((string) $response->headers->get('Location'), $user, 'Programação');
    }

    public function test_other_departments_do_not_receive_a_link(): void
    {
        $church = $this->church();
        $user = $this->volunteerIn($church, $this->ministry($church, 'Comunicação . Áudio'));

        $this->actingAs($user)
            ->get(route('nstimer.sso'))
            ->assertForbidden();

        $this->actingAs($this->volunteerIn($church, $this->ministry($church, 'Técnica')))
            ->get(route('nstimer.sso'))
            ->assertForbidden();

        $this->assertFalse(NsTimerSso::belongsToProgramacao($user));
        $this->assertFalse(NsTimerSso::isProgramacaoDepartment('Comunicação . Áudio'));
        $this->assertFalse(NsTimerSso::isProgramacaoDepartment('Técnica'));
        $this->assertFalse(NsTimerSso::isProgramacaoDepartment('Programação do Sábado'));
        $this->assertTrue(NsTimerSso::isProgramacaoDepartment('Programação'));
        $this->assertTrue(NsTimerSso::isProgramacaoDepartment('Comunicação . Programação'));
    }

    public function test_guest_is_not_sent_to_ns_timer(): void
    {
        $this->get(route('nstimer.sso'))
            ->assertRedirect(route('login'));
    }

    public function test_missing_secret_or_identity_does_not_redirect_to_ns_timer(): void
    {
        $church = $this->church();
        $user = $this->volunteerIn($church, $this->ministry($church, 'Comunicação . Programação'), [
            'name' => 'Nome da Pessoa',
            'email' => 'pessoa@novasemente.com.br',
        ]);

        config(['nstimer.sso_secret' => '']);

        $this->actingAs($user)
            ->get(route('nstimer.sso'))
            ->assertRedirect(route('mobile.profile'))
            ->assertSessionHas('error');

        config(['nstimer.sso_secret' => self::SECRET]);
        $user->forceFill(['email' => null])->save();

        $this->actingAs($user->fresh())
            ->get(route('nstimer.sso'))
            ->assertRedirect(route('mobile.profile'))
            ->assertSessionHas('error');
    }

    public function test_unsafe_origin_is_refused(): void
    {
        config(['nstimer.origin' => 'https://user:segredo@nstimer.novasemente.com.br']);

        $church = $this->church();
        $user = $this->volunteerIn($church, $this->ministry($church, 'Programação'));

        $response = $this->actingAs($user)->get(route('nstimer.sso'));

        $response->assertRedirect(route('mobile.profile'));
        $this->assertStringNotContainsString('token=', (string) $response->headers->get('Location'));
        $this->assertStringNotContainsString('segredo', (string) $response->headers->get('Location'));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function volunteerIn(Church $church, Ministry $ministry, array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'church_id' => $church->id,
            'is_volunteer' => true,
        ], $attributes));
        $user->ensureVolunteerProfile();
        $user->volunteerProfile?->ministries()->sync([(int) $ministry->id]);

        return $user->fresh() ?? $user;
    }

    private function church(): Church
    {
        return Church::query()->create([
            'name' => 'Nova Semente',
            'slug' => 'nova-semente-nstimer',
            'active' => true,
        ]);
    }

    private function ministry(Church $church, string $name): Ministry
    {
        return Ministry::query()->create([
            'church_id' => $church->id,
            'name' => $name,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function assertNsTimerRedirect(?string $location, User $user, string $department): array
    {
        $this->assertNotNull($location);
        $parts = parse_url((string) $location);
        $this->assertIsArray($parts);
        $this->assertSame('/auth/conecta', $parts['path'] ?? null);
        parse_str((string) ($parts['query'] ?? ''), $query);
        $token = $query['token'] ?? null;
        $this->assertIsString($token);

        $segments = explode('.', $token);
        $this->assertCount(3, $segments);
        [$header, $payload, $signature] = $segments;

        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $header.'.'.$payload, self::SECRET, true)), '+/', '-_'), '=');
        $this->assertSame($expected, $signature);

        $headerJson = json_decode($this->base64UrlDecode($header), true);
        $claims = json_decode($this->base64UrlDecode($payload), true);
        $this->assertSame(['typ' => 'JWT', 'alg' => 'HS256'], $headerJson);
        $this->assertIsArray($claims);
        $this->assertSame(
            ['iss', 'aud', 'sub', 'email', 'name', 'department', 'jti', 'iat', 'exp'],
            array_keys($claims),
        );
        $this->assertSame('conecta', $claims['iss']);
        $this->assertSame('nstimer', $claims['aud']);
        $this->assertSame((string) $user->id, $claims['sub']);
        $this->assertSame($user->email, $claims['email']);
        $this->assertSame($user->name, $claims['name']);
        $this->assertSame($department, $claims['department']);
        $this->assertIsString($claims['jti']);
        $this->assertNotSame('', $claims['jti']);
        $this->assertLessThanOrEqual(200, mb_strlen($claims['jti']));
        $this->assertIsInt($claims['iat']);
        $this->assertIsInt($claims['exp']);
        $this->assertSame(NsTimerSso::TOKEN_TTL_SECONDS, $claims['exp'] - $claims['iat']);
        $this->assertLessThanOrEqual(60, $claims['exp'] - $claims['iat']);
        $this->assertArrayNotHasKey('role', $claims);
        $this->assertArrayNotHasKey('admin', $claims);
        $this->assertArrayNotHasKey('password', $claims);

        return $claims;
    }

    private function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder > 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        $this->assertNotFalse($decoded);

        return $decoded;
    }
}
