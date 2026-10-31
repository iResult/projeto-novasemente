<?php

use App\Models\Poll;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('polls') || ! Schema::hasColumn('polls', 'response_type')) {
            return;
        }

        $question = Poll::WEEKLY_SUGGESTION_QUESTION;
        $churchIds = DB::table('churches')->orderBy('id')->pluck('id');

        foreach ($churchIds as $churchId) {
            $existing = DB::table('polls')
                ->where('church_id', $churchId)
                ->where('question', $question)
                ->first();

            if ($existing === null) {
                $creatorId = DB::table('users')->where('church_id', $churchId)->orderBy('id')->value('id');
                DB::table('polls')->insert([
                    'church_id' => $churchId,
                    'created_by' => $creatorId,
                    'question' => $question,
                    'allow_multiple' => false,
                    'response_type' => Poll::RESPONSE_TEXT,
                    'status' => Poll::STATUS_OPEN,
                    'public_token' => bin2hex(random_bytes(20)),
                    'display_bg_color' => '#0f172a',
                    'display_font' => 'sans',
                    'display_chart' => 'bar',
                    'display_logo' => 'horizontal-color',
                    'display_enabled' => false,
                    'publish_to_feed' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                continue;
            }

            DB::table('polls')
                ->where('id', $existing->id)
                ->update([
                    'response_type' => Poll::RESPONSE_TEXT,
                    'status' => Poll::STATUS_OPEN,
                    'display_enabled' => false,
                    'publish_to_feed' => true,
                    'updated_at' => now(),
                ]);

            DB::table('poll_options')->where('poll_id', $existing->id)->delete();
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('polls')) {
            return;
        }

        $ids = DB::table('polls')
            ->where('question', Poll::WEEKLY_SUGGESTION_QUESTION)
            ->pluck('id');

        foreach ($ids as $id) {
            if (DB::table('poll_votes')->where('poll_id', $id)->exists()) {
                continue;
            }

            DB::table('poll_options')->where('poll_id', $id)->delete();
            DB::table('polls')->where('id', $id)->delete();
        }
    }
};
