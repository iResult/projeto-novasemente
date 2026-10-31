<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\ChurchSolicitation;
use App\Models\User;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestBaptismRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_opens_the_form_and_sends_a_request_without_a_list(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();

        $this->get(route('mobile.baptism'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Solicitations/BaptismRequest')
                ->missing('mySolicitations'));

        $this->post(route('mobile.baptism.store'), [
            'message' => 'Quero ser batizado.',
            'guest_name' => 'João',
            'email' => 'joao@example.com',
            'phone' => '11999998888',
        ])->assertRedirect(route('mobile.baptism'))
            ->assertSessionHas('success');

        $solicitation = ChurchSolicitation::query()->first();
        $this->assertNotNull($solicitation);
        $this->assertSame($church->id, $solicitation->church_id);
        $this->assertNull($solicitation->user_id);
        $this->assertSame('baptism', $solicitation->type);
        $this->assertSame('Quero ser batizado.', $solicitation->message);
        $this->assertSame('João', $solicitation->memberDisplayName());
        $this->assertSame('joao@example.com', $solicitation->memberEmail());
        $this->assertSame('11999998888', $solicitation->memberPhone());

        $this->get(route('mobile.baptism'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Solicitations/BaptismRequest')
                ->missing('mySolicitations'));
    }

    public function test_logged_in_member_still_sees_the_baptism_list(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();
        $member = User::factory()->create(['church_id' => $church->id]);

        $this->actingAs($member)
            ->get(route('mobile.baptism'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Solicitations/Hub')
                ->where('singleBaptismType', true)
                ->has('mySolicitations'));
    }
}
