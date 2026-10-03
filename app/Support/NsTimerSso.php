<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Atalho autenticado do Conecta para o NS Timer.
 * O JWT nasce aqui, na sessão já logada — nunca no navegador.
 */
final class NsTimerSso
{
    public const TOKEN_TTL_SECONDS = 60;

    /** Comparação do NS Timer: sem acento e em minúsculas. */
    public const DEPARTMENT_KEY = 'programacao';

    /** Valor enviado no JWT. O NS Timer recusa outro departamento. */
    public const DEPARTMENT_CLAIM = 'Programação';

    public static function canOpen(User $user): bool
    {
        return self::belongsToProgramacao($user) || $user->hasAnyRole(['admin', 'super_admin']);
    }

    public static function belongsToProgramacao(User $user): bool
    {
        return self::departmentLabel($user) !== null;
    }

    /**
     * @return array{status: 'ok', url: string}|array{status: 'forbidden'}|array{status: 'error', message: string}
     */
    public static function attempt(User $user): array
    {
        if (! self::canOpen($user)) {
            return ['status' => 'forbidden'];
        }

        $secret = trim((string) config('nstimer.sso_secret'));
        if ($secret === '') {
            return ['status' => 'error', 'message' => 'Não foi possível abrir o NS Timer agora.'];
        }

        $origin = self::origin();
        if ($origin === null) {
            return ['status' => 'error', 'message' => 'Não foi possível abrir o NS Timer agora.'];
        }

        $email = trim((string) $user->email);
        $name = trim((string) $user->name);
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false || mb_strlen($email) > 320) {
            return ['status' => 'error', 'message' => 'Sua conta precisa de um e-mail válido para entrar no NS Timer.'];
        }
        if ($name === '') {
            return ['status' => 'error', 'message' => 'Sua conta precisa de um nome para entrar no NS Timer.'];
        }
        if (mb_strlen($name) > 200) {
            $name = mb_substr($name, 0, 200);
        }

        $sub = trim((string) $user->getKey());
        if ($sub === '' || mb_strlen($sub) > 200) {
            return ['status' => 'error', 'message' => 'Não foi possível abrir o NS Timer agora.'];
        }

        $iat = now()->getTimestamp();
        $claims = [
            'iss' => 'conecta',
            'aud' => 'nstimer',
            'sub' => $sub,
            'email' => $email,
            'name' => $name,
            'department' => self::DEPARTMENT_CLAIM,
            'jti' => (string) Str::uuid(),
            'iat' => $iat,
            'exp' => $iat + self::TOKEN_TTL_SECONDS,
        ];

        $token = self::sign($claims, $secret);

        return [
            'status' => 'ok',
            'url' => $origin.'/auth/conecta?token='.rawurlencode($token),
        ];
    }

    public static function isProgramacaoDepartment(string $name): bool
    {
        $normalized = self::normalizeDepartment($name);
        if ($normalized === self::DEPARTMENT_KEY) {
            return true;
        }

        $separator = strrpos($normalized, '.');
        if ($separator === false) {
            return false;
        }

        $segment = trim(substr($normalized, $separator + 1));

        return $segment === self::DEPARTMENT_KEY;
    }

    private static function departmentLabel(User $user): ?string
    {
        $names = $user->ministries()->pluck('ministries.name')->all();

        $volunteer = $user->volunteerProfile()->first();
        if ($volunteer !== null) {
            $names = array_merge(
                $names,
                $volunteer->ministries()->pluck('ministries.name')->all(),
            );
        }

        $match = null;
        foreach ($names as $name) {
            $label = trim((string) $name);
            if ($label === '' || ! self::isProgramacaoDepartment($label)) {
                continue;
            }
            if ($match === null || strcmp($label, $match) < 0) {
                $match = $label;
            }
        }

        return $match;
    }

    private static function normalizeDepartment(string $name): string
    {
        return Str::lower(Str::ascii(trim($name)));
    }

    private static function origin(): ?string
    {
        $configured = trim((string) config('nstimer.origin'));
        if ($configured === '') {
            return null;
        }

        $parts = parse_url($configured);
        if (! is_array($parts)) {
            return null;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = (string) ($parts['host'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':'.(int) $parts['port'] : '';

        return $scheme.'://'.$host.$port;
    }

    /**
     * @param  array<string, int|string>  $claims
     */
    private static function sign(array $claims, string $secret): string
    {
        $header = self::base64Url((string) json_encode(
            ['typ' => 'JWT', 'alg' => 'HS256'],
            JSON_THROW_ON_ERROR,
        ));
        $payload = self::base64Url((string) json_encode(
            $claims,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        ));
        $signature = self::base64Url(hash_hmac('sha256', $header.'.'.$payload, $secret, true));

        return $header.'.'.$payload.'.'.$signature;
    }

    private static function base64Url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
