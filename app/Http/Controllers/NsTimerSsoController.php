<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\NsTimerSso;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class NsTimerSsoController extends Controller
{
    public function redirect(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $result = NsTimerSso::attempt($user);

        if ($result['status'] === 'forbidden') {
            abort(403);
        }

        if ($result['status'] === 'error') {
            return redirect()
                ->route('mobile.profile')
                ->with('error', $result['message']);
        }

        $headers = [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'Referrer-Policy' => 'no-referrer',
        ];

        if ($request->headers->has('X-Inertia')) {
            return Inertia::location($result['url'])->withHeaders($headers);
        }

        return redirect()->away($result['url'])->withHeaders($headers);
    }
}
