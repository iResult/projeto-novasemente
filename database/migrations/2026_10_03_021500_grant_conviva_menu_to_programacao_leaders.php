<?php

use App\Support\ConvivaMenuAccess;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        ConvivaMenuAccess::grant();
    }

    public function down(): void
    {
        // A concessão é aditiva. Reverter não tira o CONVIVA de admin e super_admin.
    }
};
