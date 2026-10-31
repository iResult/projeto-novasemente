<?php

namespace App\Http\Controllers;

use App\Models\Church;
use App\Models\PublicationComment;
use App\Models\PublicationLike;
use App\Support\PublicationGuest;
use App\Support\PublicationSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PublicationEngagementController extends Controller
{
    public function toggleLike(Request $request, string $feedId): JsonResponse
    {
        abort_unless(Schema::hasTable('publication_likes'), 503);

        [$type, $subjectId, $churchId] = $this->resolveSubjectOrAbort($request, $feedId);

        $user = $request->user();
        $guestLike = $user === null && $type === 'polls';
        abort_unless($user !== null || $guestLike, 401);

        $query = PublicationLike::query()
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId);

        if ($user !== null) {
            $query->where('user_id', $user->id);
            $guestKey = null;
        } else {
            $guestKey = PublicationGuest::key($request);
            $query->where('guest_key', $guestKey);
        }

        $existing = $query->first();

        if ($existing !== null) {
            $existing->delete();
            $liked = false;
        } else {
            PublicationLike::query()->create([
                'user_id' => $user?->id,
                'guest_key' => $guestKey,
                'church_id' => $churchId,
                'subject_type' => $type,
                'subject_id' => $subjectId,
            ]);
            $liked = true;
        }

        $likesCount = PublicationLike::query()
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId)
            ->count();

        return response()->json([
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }

    public function comments(Request $request, string $feedId): JsonResponse
    {
        abort_unless(Schema::hasTable('publication_comments'), 503);

        [$type, $subjectId] = $this->resolveSubjectOrAbort($request, $feedId);

        $guestKey = $request->user() === null ? PublicationGuest::existingKey($request) : null;

        $comments = PublicationComment::query()
            ->with(['user:id,name'])
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId)
            ->orderBy('created_at')
            ->limit(200)
            ->get()
            ->map(fn (PublicationComment $c) => $this->serializeComment($c, $request->user()?->id, $guestKey));

        $commentsCount = PublicationComment::query()
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId)
            ->count();

        return response()->json([
            'comments' => $comments,
            'comments_count' => $commentsCount,
        ]);
    }

    public function storeComment(Request $request, string $feedId): JsonResponse
    {
        abort_unless(Schema::hasTable('publication_comments'), 503);

        [$type, $subjectId, $churchId] = $this->resolveSubjectOrAbort($request, $feedId);

        $user = $request->user();
        $guestComment = $user === null && $type === 'polls';
        abort_unless($user !== null || $guestComment, 401);

        $rules = [
            'body' => ['required', 'string', 'min:1', 'max:1000'],
        ];
        if ($guestComment) {
            $rules['author_name'] = ['required', 'string', 'min:2', 'max:80'];
        }

        $data = $request->validate($rules, [
            'author_name.required' => 'Informe seu nome ou apelido.',
            'author_name.min' => 'Use pelo menos 2 letras no nome ou apelido.',
            'author_name.max' => 'Nome ou apelido muito longo.',
            'body.required' => 'Escreva um comentário.',
        ]);

        $body = trim(strip_tags((string) $data['body']));
        $body = Str::of($body)->replaceMatches('/\s+/u', ' ')->trim()->toString();
        if ($body === '') {
            return response()->json([
                'message' => 'Comentário vazio.',
                'errors' => ['body' => ['Comentário vazio.']],
            ], 422);
        }

        $authorName = null;
        $guestKey = null;
        if ($guestComment) {
            $authorName = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $data['author_name'])) ?? '');
            $guestKey = PublicationGuest::key($request);
        }

        $comment = PublicationComment::query()->create([
            'user_id' => $user?->id,
            'author_name' => $authorName,
            'guest_key' => $guestKey,
            'church_id' => $churchId,
            'subject_type' => $type,
            'subject_id' => $subjectId,
            'body' => $body,
        ]);
        $comment->load(['user:id,name']);

        $commentsCount = PublicationComment::query()
            ->where('subject_type', $type)
            ->where('subject_id', $subjectId)
            ->count();

        return response()->json([
            'comment' => $this->serializeComment($comment, $user?->id, $guestKey),
            'comments_count' => $commentsCount,
        ], 201);
    }

    public function destroyOwnComment(Request $request, PublicationComment $comment): JsonResponse
    {
        $user = $request->user();
        $guestKey = $user === null ? PublicationGuest::existingKey($request) : null;
        $ownsAsUser = $user !== null && (int) $comment->user_id === (int) $user->id;
        $ownsAsGuest = $guestKey !== null
            && $comment->subject_type === 'polls'
            && $comment->guest_key === $guestKey;
        abort_unless($user !== null || $ownsAsGuest, 401);
        abort_unless($ownsAsUser || $ownsAsGuest, 403);

        $comment->deleted_by = $user?->id;
        $comment->save();
        $comment->delete();

        $commentsCount = PublicationComment::query()
            ->where('subject_type', $comment->subject_type)
            ->where('subject_id', $comment->subject_id)
            ->count();

        return response()->json([
            'ok' => true,
            'comments_count' => $commentsCount,
        ]);
    }

    /**
     * @return array{0: string, 1: int, 2: int|null}
     */
    private function resolveSubjectOrAbort(Request $request, string $feedId): array
    {
        $parsed = PublicationSubject::parseFeedId($feedId);
        abort_if($parsed === null, 404);

        $churchId = Church::resolveWorkingId($request);
        abort_unless(
            PublicationSubject::exists($parsed['type'], $parsed['id'], $churchId),
            404
        );

        return [$parsed['type'], $parsed['id'], $churchId];
    }

    /**
     * @return array{id: int, body: string, author_name: string, author_initial: string, is_mine: bool, created_at: string|null, created_at_label: string}
     */
    private function serializeComment(PublicationComment $comment, ?int $viewerId, ?string $guestKey = null): array
    {
        $name = trim((string) ($comment->user?->name ?? $comment->author_name ?? 'Visitante'));
        $initial = mb_strtoupper(mb_substr($name !== '' ? $name : 'V', 0, 1));
        $created = $comment->created_at;
        $isMine = ($viewerId !== null && (int) $comment->user_id === $viewerId)
            || ($guestKey !== null && $guestKey !== '' && $comment->guest_key === $guestKey);

        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author_name' => $name !== '' ? $name : 'Visitante',
            'author_initial' => $initial,
            'is_mine' => $isMine,
            'created_at' => $created?->toIso8601String(),
            'created_at_label' => $created ? $created->diffForHumans() : '',
        ];
    }
}
