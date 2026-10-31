<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\ChurchSolicitation;
use App\Models\Pastor;
use App\Models\PastoralAvailability;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\ChurchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaleComNovaSementeTest extends TestCase
{
    use RefreshDatabase;

    public function test_hub_lists_the_contact_cards_for_a_guest(): void
    {
        $this->seed(ChurchSeeder::class);

        $this->get(route('mobile.fale'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/FaleComNovaSemente')
                ->where('nsWhatsPendingReply', 0));
    }

    public function test_guest_can_send_baby_presentation_and_bible_study_without_login(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();

        $this->get(route('mobile.fale.baby'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Mobile/Solicitations/GuestRequest'));

        $this->post(route('mobile.fale.baby.store'), [
            'message' => 'Quero apresentar meu bebê.',
            'guest_name' => 'Marina',
            'email' => 'marina@example.com',
            'phone' => '11988887777',
        ])->assertRedirect(route('mobile.fale.baby'))
            ->assertSessionHas('success');

        $baby = ChurchSolicitation::query()->where('type', 'baby_presentation')->first();
        $this->assertNotNull($baby);
        $this->assertSame($church->id, $baby->church_id);
        $this->assertNull($baby->user_id);
        $this->assertSame('Marina', $baby->memberDisplayName());

        $this->post(route('mobile.fale.bible.store'), [
            'message' => 'Quero estudar a Bíblia.',
            'guest_name' => 'Paulo',
            'email' => 'paulo@example.com',
            'phone' => '11977776666',
        ])->assertRedirect(route('mobile.fale.bible'))
            ->assertSessionHas('success');

        $study = ChurchSolicitation::query()->where('type', 'bible_study')->first();
        $this->assertNotNull($study);
        $this->assertNull($study->user_id);
        $this->assertSame('Paulo', $study->memberDisplayName());
    }

    public function test_logged_in_member_is_sent_to_the_account_hub(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();
        $member = User::factory()->create(['church_id' => $church->id]);

        $this->actingAs($member)
            ->get(route('mobile.fale.baby'))
            ->assertRedirect(route('mobile.solicitations.hub', ['novo' => 1, 'tipo' => 'baby_presentation']));

        $this->actingAs($member)
            ->get(route('mobile.fale.pastor'))
            ->assertRedirect(route('mobile.solicitations.hub', ['novo' => 1, 'tipo' => 'pastoral']));

        $this->actingAs($member)
            ->post(route('mobile.fale.bible.store'), [
                'message' => 'Não deveria gravar por aqui.',
                'guest_name' => 'Ana',
                'email' => 'ana@example.com',
                'phone' => '11966665555',
            ])
            ->assertNotFound();
    }

    public function test_guest_can_book_a_free_pastor_slot(): void
    {
        $this->seed(ChurchSeeder::class);
        $church = Church::query()->firstOrFail();
        $pastor = Pastor::query()->create([
            'church_id' => $church->id,
            'name' => 'Pr. André',
            'sort_order' => 1,
        ]);

        $tz = (string) config('app.timezone');
        $slotStart = Carbon::now($tz)->addDay()->setTime(10, 0)->startOfMinute();

        PastoralAvailability::query()->create([
            'church_id' => $church->id,
            'pastor_id' => $pastor->id,
            'date' => $slotStart->toDateString(),
            'start' => '10:00',
            'end' => '10:30',
            'modality' => 'presential',
            'bookable_by_members' => true,
        ]);

        $this->get(route('mobile.fale.pastor'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Solicitations/GuestPastoralRequest')
                ->has('pastors', 1));

        $this->post(route('mobile.fale.pastor.store'), [
            'guest_name' => 'Lúcia',
            'email' => 'lucia@example.com',
            'phone' => '11955554444',
            'assigned_pastor_id' => $pastor->id,
            'preferred_start' => $slotStart->toIso8601String(),
            'subject' => 'Conversa',
            'notes' => 'Quero um momento de oração.',
        ])->assertRedirect(route('mobile.fale.pastor'))
            ->assertSessionHas('success');

        $solicitation = ChurchSolicitation::query()->where('type', 'pastor_visit')->first();
        $this->assertNotNull($solicitation);
        $this->assertNull($solicitation->user_id);
        $this->assertSame($pastor->id, $solicitation->assigned_pastor_id);
        $this->assertSame('Lúcia', $solicitation->memberDisplayName());
        $this->assertSame('presential', data_get($solicitation->meta, 'pastoral_visit.preferred_modality'));
        $this->assertNotEmpty(data_get($solicitation->meta, 'pastoral_visit.preferred_start'));
    }
}
