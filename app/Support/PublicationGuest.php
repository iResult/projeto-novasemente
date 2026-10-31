<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class PublicationGuest
{
    public const SESSION_KEY = 'publication_guest_key';

    public static function existingKey(Request $request): ?string
    {
        $key = $request->session()->get(self::SESSION_KEY);

        return is_string($key) && $key !== '' ? $key : null;
    }

    public static function key(Request $request): string
    {
        $existing = self::existingKey($request);
        if ($existing !== null) {
            return $existing;
        }

        $key = Str::random(40);
        $request->session()->put(self::SESSION_KEY, $key);

        return $key;
    }
}
