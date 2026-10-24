<?php

namespace App\Http\Controllers;

use App\Services\NsTimerLiveService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NsTimerFollowController extends Controller
{
    public function show(NsTimerLiveService $live): Response
    {
        return Inertia::render('Mobile/AcompanharCulto', [
            'follow' => $live->payload(),
        ]);
    }

    public function live(NsTimerLiveService $live): JsonResponse
    {
        return response()
            ->json($live->payload())
            ->header('Cache-Control', 'no-store');
    }
}
