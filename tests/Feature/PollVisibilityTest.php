<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Church;
use App\Models\Poll;
use App\Models\PollVote;
use App\Models\User;
use Database\Seeders\ChurchSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PollVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_hide_poll_from_congregation_and_show_it_again(): void
    {
        $this->seed([RolePermissionSeeder::class, ChurchSeeder::class]);
        $guard = 'web';
        Permission::firstOrCreate(['name' => 'polls.manage', 'guard_name' => $guard]);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => $guard]);
        $adminRole->givePermissionTo('polls.manage');
        Role::firstOrCreate(['name' => 'membro', 'guard_name' => $guard]);

        $churchId = (int) Church::query()->orderBy('id')->value('id');
        $admin = User::factory()->create(['church_id' => $churchId]);
        $admin->assignRole('admin');
        $member = User::factory()->create(['church_id' => $churchId]);
        $member->assignRole('membro');

        $poll = Poll::query()->create([
            'church_id' => $churchId,
            'created_by' => $admin->id,
            'question' => 'Qual culto você prefere?',
            'allow_multiple' => false,
            'response_type' => Poll::RESPONSE_CHOICE,
            'status' => Poll::STATUS_OPEN,
            'publish_to_feed' => false,
        ]);

        PollVote::query()->create([
            'poll_id' => $poll->id,
            'user_id' => $member->id,
            'voter_key' => 'u:'.$member->id,
        ]);

        $this->actingAs($admin)
            ->withSession(['working_church_id' => $churchId])
            ->patch(route('polls.visibility', $poll), ['visible' => false])
            ->assertRedirect(route('polls.index'));

        $this->assertSame(Poll::STATUS_DRAFT, $poll->fresh()->status);

        $this->actingAs($member)
            ->get(route('mobile.polls.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Mobile/Polls/Index')
                ->where('polls', []));

        $this->actingAs($member)
            ->get(route('mobile.polls.show', $poll))
            ->assertNotFound();

        $this->actingAs($admin)
            ->withSession(['working_church_id' => $churchId])
            ->patch(route('polls.visibility', $poll), ['visible' => true])
            ->assertRedirect(route('polls.index'));

        $this->assertSame(Poll::STATUS_OPEN, $poll->fresh()->status);

        $this->actingAs($member)
            ->get(route('mobile.polls.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('polls.0.id', $poll->id));
    }

    public function test_closed_or_removed_poll_leaves_the_app_even_after_a_vote(): void
    {
        $this->seed([RolePermissionSeeder::class, ChurchSeeder::class]);
        Role::firstOrCreate(['name' => 'membro', 'guard_name' => 'web']);

        $churchId = (int) Church::query()->orderBy('id')->value('id');
        $member = User::factory()->create(['church_id' => $churchId]);
        $member->assignRole('membro');

        $poll = Poll::query()->create([
            'church_id' => $churchId,
            'created_by' => $member->id,
            'question' => 'Qual culto você prefere?',
            'allow_multiple' => false,
            'response_type' => Poll::RESPONSE_CHOICE,
            'status' => Poll::STATUS_CLOSED,
        ]);

        PollVote::query()->create([
            'poll_id' => $poll->id,
            'user_id' => $member->id,
            'voter_key' => 'u:'.$member->id,
        ]);

        AppNotification::query()->create([
            'church_id' => $churchId,
            'title' => 'Nova enquete: Qual culto você prefere?',
            'body' => 'Vote e veja o resultado da congregação.',
            'action_url' => route('mobile.polls.show', ['poll' => $poll->id], absolute: true),
            'created_by' => $member->id,
        ]);

        $this->actingAs($member)
            ->get(route('mobile.polls.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('polls', []));

        $this->actingAs($member)
            ->get(route('mobile.polls.show', $poll))
            ->assertNotFound();

        app(\App\Services\PublicationBroadcastNotifier::class)->retractPoll($poll);

        $this->assertDatabaseMissing('app_notifications', [
            'action_url' => route('mobile.polls.show', ['poll' => $poll->id], absolute: true),
        ]);
    }
}
