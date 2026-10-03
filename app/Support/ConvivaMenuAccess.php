<?php

namespace App\Support;

use App\Models\Ministry;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * CONVIVA no menu do painel: administrador e líder do departamento de Programação.
 * Secretaria e pastor continuam de fora.
 */
final class ConvivaMenuAccess
{
    /** @var list<string> */
    public const PERMISSIONS = ['conviva.view', 'conviva.manage'];

    /** @var list<string> */
    private const EXCLUDED_ROLES = ['secretaria', 'pastor', 'membro', 'financeiro'];

    public static function grant(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = config('auth.defaults.guard');

        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => $guard,
            ]);
        }

        Role::query()
            ->where('guard_name', $guard)
            ->whereHas('permissions', fn ($query) => $query->where('name', 'programacao.manage'))
            ->each(function (Role $role): void {
                if (in_array($role->name, self::EXCLUDED_ROLES, true)) {
                    return;
                }

                $role->givePermissionTo(self::PERMISSIONS);
            });

        $ministryIds = Ministry::query()
            ->get(['id', 'name'])
            ->filter(fn (Ministry $ministry) => NsTimerSso::isProgramacaoDepartment((string) $ministry->name))
            ->pluck('id');

        if ($ministryIds->isEmpty()) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return;
        }

        User::query()
            ->whereHas('ministries', fn ($query) => $query->whereIn('ministries.id', $ministryIds))
            ->each(fn (User $user) => $user->givePermissionTo(self::PERMISSIONS));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
