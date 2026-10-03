<?php

namespace Tests\Feature;

use App\Models\Church;
use App\Models\Ministry;
use App\Models\User;
use App\Support\ConvivaMenuAccess;
use Database\Seeders\ChurchSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConvivaMenuAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_programacao_leader_gets_conviva_menu_and_secretaria_does_not(): void
    {
        $this->seed([RolePermissionSeeder::class, ChurchSeeder::class]);
        $guard = config('auth.defaults.guard');
        $churchId = (int) Church::query()->orderBy('id')->value('id');

        $comunicacao = Role::query()->create([
            'name' => 'Comunicação',
            'guard_name' => $guard,
        ]);
        $comunicacao->givePermissionTo('programacao.manage');

        $leader = User::factory()->create(['church_id' => $churchId]);
        $leader->assignRole($comunicacao);
        $ministry = Ministry::query()->create([
            'church_id' => $churchId,
            'name' => 'Comunicação . Programação',
        ]);
        $leader->ministries()->attach($ministry->id);

        $secretaria = User::factory()->create(['church_id' => $churchId]);
        $secretaria->assignRole('secretaria');

        ConvivaMenuAccess::grant();

        $comunicacao->refresh();
        $this->assertTrue($comunicacao->hasPermissionTo('conviva.view'));
        $this->assertTrue($comunicacao->hasPermissionTo('conviva.manage'));

        $secretariaRole = Role::findByName('secretaria', $guard);
        $this->assertFalse($secretariaRole->hasPermissionTo('conviva.view'));
        $this->assertFalse($secretaria->fresh()->can('conviva.view'));

        $this->assertTrue($leader->fresh()->can('conviva.manage'));
        $this->assertTrue(Role::findByName('admin', $guard)->hasPermissionTo('conviva.manage'));

        $this->actingAs($leader)
            ->withSession(['working_church_id' => $churchId])
            ->get(route('conviva.index'))
            ->assertOk();
    }

    public function test_ministry_leader_without_programacao_role_still_gets_conviva(): void
    {
        $this->seed([RolePermissionSeeder::class, ChurchSeeder::class]);
        $churchId = (int) Church::query()->orderBy('id')->value('id');

        Permission::findOrCreate('programacao.manage', config('auth.defaults.guard'));

        $leader = User::factory()->create([
            'church_id' => $churchId,
            'is_ministry_leader' => true,
        ]);
        $leader->assignRole('membro');
        $ministry = Ministry::query()->create([
            'church_id' => $churchId,
            'name' => 'Programação',
        ]);
        $leader->ministries()->attach($ministry->id);

        ConvivaMenuAccess::grant();

        $this->assertTrue($leader->fresh()->can('conviva.view'));
        $this->assertFalse(Role::findByName('membro', config('auth.defaults.guard'))->hasPermissionTo('conviva.view'));
    }
}
