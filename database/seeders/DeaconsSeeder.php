<?php

namespace Database\Seeders;

use App\Models\Church;
use App\Models\Ministry;
use App\Models\ScheduleAssignment;
use App\Models\ScheduleCoordinator;
use App\Models\ScheduleRole;
use App\Models\User;
use App\Models\Volunteer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Sincroniza voluntários (diáconos) e escalas da IASD Paraíso - Nova Semente.
 *
 * Fonte: Escala dos Diáconos — 2º semestre 2026 (atualização 01/09/2026).
 * 1º–4º sábados com coordenador, lista completa e função (Ordenado / Não ordenado).
 * O 5º sábado (meses com 5 semanas) fica vazio.
 *
 * Idempotente: substitui apenas a escala recorrente do ministério Diáconos.
 */
class DeaconsSeeder extends Seeder
{
    /** @var array<string, string> nome na escala => nome preferido no banco */
    private array $nameAliases = [
        'Marcio Rogerio de O. Preto' => 'Márcio Rogério de Oliveira Preto',
        'Marcio Preto' => 'Márcio Rogério de Oliveira Preto',
        'Elton Jonnes Laranja Rinadin' => 'Elton Jonnes Laranja Rinaldin',
        'Tagarth Trindade' => 'Tágarth Ernest Trindade',
        'Paulo Duarte' => 'Paulo Marcelo Duarte',
        'Nelson' => 'Nelson Pereira dos Santos Filho',
        'Marcel Edner Barreto' => 'Marcel edner Barreto',
        'Artur João Ferreira Filho' => 'Artur Joao Ferreira Filho',
    ];

    public function run(): void
    {
        $churchId = $this->resolveChurchId();
        if (! $churchId) {
            $this->command?->warn('Nenhuma igreja ativa encontrada. Crie a igreja Nova Semente antes.');

            return;
        }

        $ministry = Ministry::where('name', 'Diáconos')
            ->where(fn ($q) => $q->where('church_id', $churchId)->orWhereNull('church_id'))
            ->first();
        if (! $ministry) {
            $ministry = Ministry::create([
                'church_id' => $churchId,
                'name' => 'Diáconos',
                'icon' => 'user_group',
                'description' => null,
            ]);
        } elseif (! $ministry->church_id) {
            $ministry->update(['church_id' => $churchId]);
        }

        $roleOrdenado = ScheduleRole::firstOrCreate([
            'name' => 'Ordenado',
            'ministry_id' => $ministry->id,
        ]);
        $roleNaoOrdenado = ScheduleRole::firstOrCreate([
            'name' => 'Não ordenado',
            'ministry_id' => $ministry->id,
        ]);

        /**
         * Escala 2º semestre 2026 — atualização 01/09/2026.
         * Diácono líder: Davi Ferronato.
         *
         * @var array<int, list<array{name: string, ordered: bool, coordinator: bool, phone?: string|null}>>
         */
        $bySaturday = [
            1 => [
                ['name' => 'Antonio Natanael de Paiva', 'ordered' => true, 'coordinator' => true, 'phone' => '11995659311'],
                ['name' => 'Alexandre Romano', 'ordered' => false, 'coordinator' => false, 'phone' => '11976330501'],
                ['name' => 'Carlos Augusto Salvador', 'ordered' => false, 'coordinator' => false, 'phone' => '11976558007'],
                ['name' => 'Carlos Ferrari', 'ordered' => true, 'coordinator' => false, 'phone' => '11981330944'],
                ['name' => 'Davi Ferronato', 'ordered' => true, 'coordinator' => false, 'phone' => '11995744203'],
                ['name' => 'Laercio Barbosa', 'ordered' => false, 'coordinator' => false, 'phone' => '11947045499'],
                ['name' => 'Paulo Duarte', 'ordered' => false, 'coordinator' => false, 'phone' => '17997786081'],
                ['name' => 'Philip Antonioli', 'ordered' => true, 'coordinator' => false, 'phone' => '11982661207'],
                ['name' => 'Rogério Ferreira', 'ordered' => true, 'coordinator' => false, 'phone' => '11954785942'],
            ],
            2 => [
                ['name' => 'Marcio Rogerio de O. Preto', 'ordered' => true, 'coordinator' => true, 'phone' => '11996027766'],
                ['name' => 'Carlos Alberto Gamberini', 'ordered' => false, 'coordinator' => false, 'phone' => '11993523876'],
                ['name' => 'Daniel Rocha Torres', 'ordered' => false, 'coordinator' => false, 'phone' => '11989351839'],
                ['name' => 'Gil Ribeiro Chaves', 'ordered' => false, 'coordinator' => false, 'phone' => '11981756511'],
                ['name' => 'Marcel Edner Barreto', 'ordered' => true, 'coordinator' => false, 'phone' => '11943938465'],
                ['name' => 'Matheus Elias Dos Santos', 'ordered' => false, 'coordinator' => false, 'phone' => '11983907481'],
                ['name' => 'Mauro Morbin da Cunha', 'ordered' => false, 'coordinator' => false, 'phone' => '11975080653'],
                ['name' => 'Rivaldo Alencar Dos Santos', 'ordered' => true, 'coordinator' => false, 'phone' => '11968482157'],
                ['name' => 'Ronaldo Oliveira', 'ordered' => true, 'coordinator' => false, 'phone' => '11999844411'],
                ['name' => 'Tagarth Trindade', 'ordered' => false, 'coordinator' => false, 'phone' => '11989646918'],
            ],
            3 => [
                ['name' => 'Ricardo Salomão', 'ordered' => true, 'coordinator' => true, 'phone' => '11993240208'],
                ['name' => 'Agnaldo Gabriel', 'ordered' => false, 'coordinator' => false, 'phone' => '11948767250'],
                ['name' => 'Carlos Moura', 'ordered' => true, 'coordinator' => false, 'phone' => '11981756511'],
                ['name' => 'Fabio Roberto Jacinto Silva', 'ordered' => false, 'coordinator' => false, 'phone' => '11947498778'],
                ['name' => 'Gilberto Ramos', 'ordered' => false, 'coordinator' => false, 'phone' => '11983382251'],
                ['name' => 'Ivan Domingues', 'ordered' => false, 'coordinator' => false, 'phone' => '11997700250'],
                ['name' => 'Nelson', 'ordered' => false, 'coordinator' => false, 'phone' => '11985120912'],
                ['name' => 'Henrique Martins', 'ordered' => false, 'coordinator' => false, 'phone' => '11955403297'],
            ],
            4 => [
                ['name' => 'Artur João Ferreira Filho', 'ordered' => false, 'coordinator' => true, 'phone' => '11983031414'],
                ['name' => 'Aslam Kildare Alberti', 'ordered' => false, 'coordinator' => false, 'phone' => '11996351569'],
                ['name' => 'Elton Jonnes Laranja Rinadin', 'ordered' => false, 'coordinator' => false, 'phone' => '11959921973'],
                ['name' => 'Jair Paulino Simões Filho', 'ordered' => false, 'coordinator' => false, 'phone' => '11984350610'],
                ['name' => 'Marco Antônio Bregalante', 'ordered' => false, 'coordinator' => false, 'phone' => '11974372467'],
                ['name' => 'Sergio Paulo Batista', 'ordered' => true, 'coordinator' => false, 'phone' => '11983998990'],
                ['name' => 'Sidney de Oliveira', 'ordered' => false, 'coordinator' => false, 'phone' => '11967153500'],
                ['name' => 'Wesley Moura', 'ordered' => true, 'coordinator' => false, 'phone' => '11999211321'],
                ['name' => 'Wilson Castro Fernandes', 'ordered' => false, 'coordinator' => false, 'phone' => '11998300626'],
            ],
            5 => [],
        ];

        // Substitui a escala recorrente atual (evita duplicados e nomes fora da planilha).
        ScheduleAssignment::query()
            ->where('ministry_id', $ministry->id)
            ->whereNull('schedule_date')
            ->where('recurring', true)
            ->delete();

        ScheduleCoordinator::query()
            ->where('ministry_id', $ministry->id)
            ->whereNull('schedule_date')
            ->where('recurring', true)
            ->delete();

        $usersByRosterName = [];
        $allEntries = collect($bySaturday)->flatten(1);

        foreach ($allEntries as $entry) {
            $rosterName = (string) $entry['name'];
            if ($rosterName === '' || isset($usersByRosterName[$rosterName])) {
                continue;
            }

            $user = $this->resolveOrCreateUser($rosterName, $churchId, $entry['phone'] ?? null);
            $volunteer = Volunteer::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $entry['phone'] ?? $user->phone,
                    'role' => 'Diácono',
                    'active' => true,
                ]
            );

            $volunteerUpdates = [
                'role' => 'Diácono',
                'active' => true,
            ];
            if (! empty($entry['phone'])) {
                $volunteerUpdates['phone'] = $entry['phone'];
            }
            if ($volunteer->name === null || $volunteer->name === '') {
                $volunteerUpdates['name'] = $user->name;
            }
            $volunteer->update($volunteerUpdates);
            $volunteer->ministries()->syncWithoutDetaching([$ministry->id]);

            $usersByRosterName[$rosterName] = $user;
        }

        // Diácono líder (planilha): Davi Ferronato.
        if (isset($usersByRosterName['Davi Ferronato'])) {
            $leader = $usersByRosterName['Davi Ferronato'];
            $leader->update(['is_ministry_leader' => true]);
            $ministry->users()->syncWithoutDetaching([$leader->id]);
        }

        foreach ($bySaturday as $saturdayNumber => $entries) {
            foreach ($entries as $entry) {
                $rosterName = $entry['name'];
                if (! isset($usersByRosterName[$rosterName])) {
                    continue;
                }

                $churchUser = $usersByRosterName[$rosterName];
                $volunteer = Volunteer::query()->where('user_id', $churchUser->id)->first();
                $isCoordinator = (bool) ($entry['coordinator'] ?? false);
                $roleId = ($entry['ordered'] ?? false) ? $roleOrdenado->id : $roleNaoOrdenado->id;

                ScheduleAssignment::create([
                    'ministry_id' => $ministry->id,
                    'user_id' => $churchUser->id,
                    'volunteer_id' => $volunteer?->id,
                    'saturday_number' => $saturdayNumber,
                    'schedule_date' => null,
                    'schedule_role_id' => $roleId,
                    'recurring' => true,
                    'assignment_month' => null,
                    'assignment_year' => null,
                    'status' => 'pending',
                ]);

                if ($isCoordinator && $volunteer) {
                    ScheduleCoordinator::create([
                        'ministry_id' => $ministry->id,
                        'saturday_number' => $saturdayNumber,
                        'schedule_date' => null,
                        'recurring' => true,
                        'volunteer_id' => $volunteer->id,
                        'user_id' => $churchUser->id,
                        'assignment_month' => null,
                        'assignment_year' => null,
                    ]);
                }
            }
        }

        $totalMembers = count($usersByRosterName);
        $totalAssignments = $allEntries->count();
        $this->command?->info(
            "Diáconos: {$totalMembers} voluntários e {$totalAssignments} escalas sincronizadas (1º a 4º sábado; 5º vazio)."
        );
    }

    private function resolveChurchId(): ?int
    {
        $churchId = null;
        if (Schema::hasColumn('churches', 'active')) {
            $churchId = Church::where('active', true)->orderBy('id')->value('id');
        }
        if (! $churchId && Schema::hasColumn('churches', 'slug')) {
            $churchId = Church::where('slug', 'nova-semente')->value('id');
        }
        if (! $churchId) {
            $churchId = Church::orderBy('id')->value('id');
        }

        return $churchId ? (int) $churchId : null;
    }

    private function resolveOrCreateUser(string $rosterName, int $churchId, ?string $phone): User
    {
        $preferredName = $this->nameAliases[$rosterName] ?? $rosterName;
        $candidates = $this->findUserCandidates($preferredName, $rosterName);

        if ($candidates->isNotEmpty()) {
            /** @var User $user */
            $user = $candidates
                ->sortBy(function (User $u) {
                    $email = (string) ($u->email ?? '');
                    $invalid = str_contains($email, '@invalid.local') || str_contains($email, 'legacy-member');
                    $admin = str_starts_with($email, 'admin@');

                    return ($invalid ? 10 : 0) + ($admin ? 5 : 0) - ($u->volunteerProfile ? 1 : 0);
                })
                ->first();

            $updates = [];
            if ($user->church_id === null) {
                $updates['church_id'] = $churchId;
            }
            if ($phone && empty($user->phone)) {
                $updates['phone'] = $phone;
            }
            if ($updates !== []) {
                $user->update($updates);
            }

            return $user;
        }

        $email = 'diacono-'.mb_strtolower(preg_replace('/\s+/', '-', Str::ascii($preferredName))).'-'.$churchId.'@invalid.local';
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $preferredName,
                'password' => bcrypt(Str::random(32)),
                'church_id' => $churchId,
                'status' => 'active',
                'phone' => $phone,
            ]
        );

        if ($user->church_id === null) {
            $user->update(['church_id' => $churchId]);
        }
        if ($phone && empty($user->phone)) {
            $user->update(['phone' => $phone]);
        }

        return $user;
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function findUserCandidates(string $preferredName, string $rosterName)
    {
        $exact = User::query()
            ->where(function ($q) use ($preferredName, $rosterName) {
                $q->whereRaw('LOWER(name) = ?', [mb_strtolower($preferredName)])
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($rosterName)]);
            })
            ->with('volunteerProfile')
            ->get();

        if ($exact->isNotEmpty()) {
            return $exact;
        }

        $tokens = collect(preg_split('/\s+/u', $preferredName) ?: [])
            ->map(fn ($t) => trim((string) $t))
            ->filter(fn ($t) => mb_strlen($t) > 2)
            ->values();

        if ($tokens->isEmpty()) {
            return collect();
        }

        $query = User::query()->with('volunteerProfile');
        foreach ($tokens->take(3) as $token) {
            $query->where('name', 'like', '%'.$token.'%');
        }

        return $query->get();
    }
}
