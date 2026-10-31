<?php

namespace App\Actions\Mission;

use App\Models\MissionMessage;
use App\Models\User;
use App\Services\MissionMessageNotifier;
use App\Support\MissionMessageContentModerator;

class SubmitMissionMessage
{
    public function __construct(
        private MissionMessageContentModerator $moderator,
        private MissionMessageNotifier $notifier,
    ) {}

    /**
     * @return array{message: MissionMessage, flash: string, level: 'success'|'info'}
     */
    public function __invoke(int $churchId, ?User $user, string $body, bool $asTeamHighlight = false, ?string $guestName = null): array
    {
        $trimmed = trim($body);
        $guestName = trim((string) $guestName);

        if ($asTeamHighlight) {
            abort_unless($user instanceof User, 403);

            $message = MissionMessage::create([
                'church_id' => $churchId,
                'user_id' => $user->id,
                'body' => $trimmed,
                'moderation_status' => MissionMessage::STATUS_PUBLISHED,
                'moderation_note' => null,
                'is_hidden' => false,
                'is_team_highlight' => true,
            ]);

            return [
                'message' => $message,
                'flash' => 'Depoimento da equipe publicado em destaque.',
                'level' => 'success',
            ];
        }

        $analysis = $this->moderator->analyze($trimmed);

        $status = $analysis->requiresReview
            ? MissionMessage::STATUS_PENDING_REVIEW
            : MissionMessage::STATUS_PUBLISHED;

        $message = MissionMessage::create([
            'church_id' => $churchId,
            'user_id' => $user?->id,
            'guest_name' => $user ? null : ($guestName !== '' ? $guestName : null),
            'body' => $trimmed,
            'moderation_status' => $status,
            'moderation_note' => $analysis->reason,
            'is_hidden' => false,
            'is_team_highlight' => false,
        ]);

        if ($status === MissionMessage::STATUS_PENDING_REVIEW) {
            $this->notifier->notifyModeratorsOfPendingMessage($message);

            return [
                'message' => $message,
                'flash' => $user
                    ? 'Depoimento enviado! Nossa equipe vai analisar antes de publicar. Você será avisado no aplicativo.'
                    : 'Depoimento enviado! Nossa equipe vai analisar antes de publicar.',
                'level' => 'info',
            ];
        }

        return [
            'message' => $message,
            'flash' => 'Depoimento publicado com sucesso.',
            'level' => 'success',
        ];
    }
}
