<?php

namespace Tests\Feature;

use App\Models\CampaignDonation;
use App\Models\Church;
use App\Models\ConvivaClass;
use App\Models\DonationCampaign;
use App\Models\MissionMessage;
use App\Models\User;
use App\Services\ReceiptOcrService;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class GuestOpenModulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_sees_ano_biblico_without_being_sent_to_login(): void
    {
        $this->get(route('mobile.ano-biblico'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/AnoBiblico')
                ->where('needsLogin', true));
    }

    public function test_guest_can_browse_talent_catalogs(): void
    {
        $this->seed(ChurchSeeder::class);

        $this->get(route('mobile.talents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Mobile/TalentConnection/Index'));

        $this->get(route('mobile.shared-talents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Mobile/SharedTalent/Index'));
    }

    public function test_guest_sees_conviva_rooms_but_cannot_check_in(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();

        ConvivaClass::query()->create([
            'church_id' => $church->id,
            'room_name' => 'Visitantes',
            'teacher_name' => 'Márcio',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->get(route('mobile.conviva.checkin'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/ConvivaCheckin')
                ->where('canCheckIn', false)
                ->where('classes.0.room_name', 'Visitantes')
                ->where('classes.0.teacher_name', 'Márcio')
                ->where('classmates', []));

        $this->post(route('mobile.conviva.checkin.store'), [
            'conviva_class_id' => 1,
        ])->assertRedirect(route('login'));
    }

    public function test_guest_can_publish_a_mission_message_with_a_name(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();

        config(['mission.message_moderation.enabled' => false]);

        $this->withSession(['working_church_id' => $church->id])
            ->post(route('mobile.mission.messages.store'), [
                'guest_name' => 'Marina',
                'body' => 'A missão mudou a minha semana.',
            ])
            ->assertRedirect(route('mobile.mission.messages'));

        $this->assertDatabaseHas('mission_messages', [
            'church_id' => $church->id,
            'user_id' => null,
            'guest_name' => 'Marina',
            'body' => 'A missão mudou a minha semana.',
            'moderation_status' => MissionMessage::STATUS_PUBLISHED,
        ]);
    }

    public function test_guest_can_register_a_campaign_receipt_with_name_and_phone(): void
    {
        Storage::fake('public');
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();
        $admin = User::factory()->create(['church_id' => $church->id]);

        $campaign = DonationCampaign::create([
            'church_id' => $church->id,
            'title' => 'Reforma do templo',
            'goal_amount' => 5000,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $mock = Mockery::mock(ReceiptOcrService::class);
        $mock->shouldReceive('extractAmount')->once()->andReturn([
            'suggested_amount' => 80.0,
            'confidence' => 'medium',
            'raw_text' => 'R$ 80,00',
        ]);
        $this->app->instance(ReceiptOcrService::class, $mock);

        $this->postJson(route('mobile.campaigns.receipt', $campaign), [
            'receipt' => UploadedFile::fake()->image('comprovante.jpg'),
        ])->assertOk();

        $this->post(route('mobile.campaigns.donate', $campaign), [
            'amount' => 80,
            'guest_name' => 'Lúcia',
            'guest_phone' => '11988887777',
            'is_anonymous' => false,
        ])->assertRedirect(route('mobile.campaigns.show', $campaign));

        $donation = CampaignDonation::query()->first();
        $this->assertNotNull($donation);
        $this->assertNull($donation->user_id);
        $this->assertSame('Lúcia', $donation->external_donor_name);
        $this->assertStringContainsString('11988887777', (string) $donation->manual_registration_note);
        $this->assertSame(80.0, (float) $campaign->fresh()->raised_amount);
    }
}
