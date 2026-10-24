<?php

use App\Models\Church;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Church::query()->each(function (Church $church): void {
            $disabled = $church->disabled_app_features;
            $disabled = is_array($disabled) ? array_values($disabled) : [];

            if (in_array('health', $disabled, true)) {
                return;
            }

            $disabled[] = 'health';

            $church->update([
                'disabled_app_features' => array_values(array_unique($disabled)),
            ]);
        });
    }

    public function down(): void
    {
        Church::query()->each(function (Church $church): void {
            $disabled = $church->disabled_app_features;
            if (! is_array($disabled) || ! in_array('health', $disabled, true)) {
                return;
            }

            $filtered = array_values(array_filter(
                $disabled,
                fn ($key) => $key !== 'health',
            ));

            $church->update([
                'disabled_app_features' => $filtered === [] ? null : $filtered,
            ]);
        });
    }
};
