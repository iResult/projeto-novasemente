<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePollVoteRequest;
use App\Models\Church;
use App\Models\Poll;
use App\Models\User;
use App\Support\PollPresenter;
use App\Support\PollVoting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PollMobileController extends Controller
{
    private function currentChurchId(): ?int
    {
        return Church::resolveWorkingId(request());
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $churchId = $this->currentChurchId();
        $ip = PollVoting::clientIp($request);

        $polls = Poll::query()
            ->forChurch($churchId)
            ->withCount('options')
            ->with([
                'options' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
                'options.votes',
            ])
            ->open()
            // Enquete de sugestão (texto livre) sempre por último.
            ->orderByRaw('CASE WHEN response_type = ? THEN 1 ELSE 0 END', [Poll::RESPONSE_TEXT])
            ->latest()
            ->get();

        return Inertia::render('Mobile/Polls/Index', [
            'polls' => $polls
                ->map(function (Poll $poll) use ($user, $ip) {
                    $hasVoted = PollVoting::hasVoted($poll, $user, $ip);

                    return PollPresenter::forMobileList($poll, $hasVoted);
                })
                ->values()
                ->all(),
        ]);
    }

    public function show(Request $request, Poll $poll): Response
    {
        $user = $request->user();
        $this->assertVisible($poll);

        $ip = PollVoting::clientIp($request);
        $hasVoted = PollVoting::hasVoted($poll, $user, $ip);
        $canSeeResults = $poll->showsResults()
            && ($hasVoted || ($user !== null && $user->can('polls.manage') && (int) $poll->church_id === (int) $this->currentChurchId()));

        return Inertia::render('Mobile/Polls/Show', [
            'poll' => PollPresenter::forMobileShow($poll, $user, $canSeeResults, $hasVoted, $ip),
            'otherOpenUnansweredCount' => $hasVoted
                ? $this->otherOpenUnansweredCount($poll, $user, $ip)
                : 0,
            'suggestedVoterName' => trim((string) ($user?->name ?? '')),
        ]);
    }

    public function vote(StorePollVoteRequest $request, Poll $poll)
    {
        $this->assertSameChurch($poll);

        try {
            if ($poll->isTextResponse()) {
                PollVoting::castText($poll, $request, (string) $request->validated('answer_text'));
                $message = 'Sugestão enviada! Obrigado pela contribuição.';
            } else {
                PollVoting::cast($poll, $request, $request->validated('option_ids'));
                $message = 'Resposta enviada! Confira o resultado.';
            }
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route('mobile.polls.show', $poll)
            ->with('success', $message);
    }

    /**
     * Outras enquetes abertas da igreja que o usuário ainda não respondeu.
     */
    private function otherOpenUnansweredCount(Poll $current, ?User $user, string $ip): int
    {
        $churchId = (int) $current->church_id;
        $voterKey = PollVoting::voterKey($user, $ip);

        return Poll::query()
            ->forChurch($churchId)
            ->open()
            ->where('id', '!=', $current->id)
            ->whereDoesntHave('votes', function ($q) use ($user, $voterKey, $ip) {
                $q->where(function ($inner) use ($user, $voterKey, $ip) {
                    $inner->where('voter_key', $voterKey);
                    if ($user !== null) {
                        $inner->orWhere('user_id', $user->id);
                    } else {
                        $inner->orWhere('voter_ip', $ip);
                    }
                });
            })
            ->count();
    }

    private function assertSameChurch(Poll $poll): void
    {
        $churchId = $this->currentChurchId();
        if ($churchId === null || (int) $poll->church_id !== (int) $churchId) {
            abort(404);
        }
    }

    private function assertVisible(Poll $poll): void
    {
        $this->assertSameChurch($poll);

        if ($poll->isOpen()) {
            return;
        }

        abort(404);
    }
}
