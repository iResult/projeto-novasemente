<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class FcmMessaging
{
    private const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    private const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

    public static function enabled(): bool
    {
        $cfg = config('services.fcm', []);

        return is_array($cfg)
            && filled($cfg['project_id'] ?? null)
            && filled($cfg['client_email'] ?? null)
            && filled($cfg['private_key'] ?? null);
    }

    /** Testa credenciais (OAuth). Útil para `notifications:check-fcm`. */
    public function canAuthenticate(): bool
    {
        if (! self::enabled()) {
            return false;
        }

        Cache::forget($this->oauthCacheKey(self::MESSAGING_SCOPE));

        $token = $this->accessToken();

        return is_string($token) && $token !== '';
    }

    public function sendVisibleNotification(string $token, string $title, string $body, array $data = []): bool
    {
        $projectId = (string) config('services.fcm.project_id');
        $deliveryToken = $this->tokenForDelivery($token);
        if ($deliveryToken === null || $deliveryToken === '') {
            return false;
        }

        $accessToken = $this->accessToken();
        if ($accessToken === null || $accessToken === '') {
            return false;
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        $dataStrings = collect($data)
            ->mapWithKeys(fn ($v, $k) => [(string) $k => is_string($v) ? $v : json_encode($v)])
            ->all();

        $payload = [
            'message' => [
                'token' => $deliveryToken,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => $dataStrings,
                'android' => [
                    'priority' => 'HIGH',
                    'notification' => [
                        'channel_id' => 'default',
                    ],
                ],
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $title,
                                'body' => $body,
                            ],
                            'sound' => 'default',
                        ],
                    ],
                ],
            ],
        ];

        $res = Http::withToken($accessToken)
            ->acceptJson()
            ->asJson()
            ->post($url, $payload);

        if ($res->successful()) {
            return true;
        }

        if ($this->isApnsDeviceToken($token)) {
            Cache::forget($this->apnsCacheKey($token));
        }

        $this->maybePruneInvalidToken($token, $res->json());

        return false;
    }

    public static function isApnsDeviceToken(string $token): bool
    {
        return (bool) preg_match('/^[0-9a-f]{64}$/i', $token);
    }

    private function maybePruneInvalidToken(string $token, mixed $json): void
    {
        $details = is_array($json) ? ($json['error'] ?? null) : null;
        if (! is_array($details)) {
            return;
        }

        $status = $details['status'] ?? null;
        $code = null;
        $errs = $details['details'] ?? null;
        if (is_array($errs)) {
            foreach ($errs as $e) {
                if (is_array($e) && isset($e['errorCode']) && is_string($e['errorCode'])) {
                    $code = $e['errorCode'];
                    break;
                }
            }
        }

        $invalidArgument = $code === 'INVALID_ARGUMENT' && ! self::isApnsDeviceToken($token);
        $shouldDelete = $status === 'NOT_FOUND'
            || in_array($code, ['UNREGISTERED', 'SENDER_ID_MISMATCH'], true)
            || $invalidArgument;

        if (! $shouldDelete) {
            return;
        }

        PushToken::query()->where('token', $token)->delete();
    }

    /**
     * O app iOS grava o token da Apple (64 hex). O FCM só entrega com token de registro.
     */
    private function tokenForDelivery(string $token): ?string
    {
        if (! self::isApnsDeviceToken($token)) {
            return $token;
        }

        $cacheKey = $this->apnsCacheKey($token);
        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $registration = $this->importApnsToken($token);
        if ($registration === null) {
            return null;
        }

        Cache::put($cacheKey, $registration, now()->addDays(7));

        return $registration;
    }

    private function importApnsToken(string $apnsToken): ?string
    {
        $accessToken = $this->accessToken(self::CLOUD_PLATFORM_SCOPE);
        if ($accessToken === null || $accessToken === '') {
            return null;
        }

        $bundleId = (string) config('services.fcm.ios_bundle_id');
        if ($bundleId === '') {
            return null;
        }

        $res = Http::withToken($accessToken)
            ->withHeaders(['access_token_auth' => 'true'])
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->post('https://iid.googleapis.com/iid/v1:batchImport', [
                'application' => $bundleId,
                'sandbox' => (bool) config('services.fcm.ios_apns_sandbox'),
                'apns_tokens' => [$apnsToken],
            ]);

        $result = $res->json('results.0');
        $registration = is_array($result) ? ($result['registration_token'] ?? null) : null;
        $status = is_array($result) ? ($result['status'] ?? null) : null;

        if ($res->successful() && $status === 'OK' && is_string($registration) && $registration !== '') {
            return $registration;
        }

        Log::warning('FCM: falha ao converter token da Apple.', [
            'http' => $res->status(),
            'status' => is_string($status) ? $status : null,
        ]);

        return null;
    }

    private function accessToken(string $scope = self::MESSAGING_SCOPE): ?string
    {
        if (! self::enabled()) {
            return null;
        }

        return Cache::remember($this->oauthCacheKey($scope), now()->addMinutes(50), function () use ($scope): ?string {
            try {
                $jwt = $this->signedJwt($scope);

                $res = Http::asForm()
                    ->acceptJson()
                    ->post('https://oauth2.googleapis.com/token', [
                        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                        'assertion' => $jwt,
                    ]);

                if (! $res->successful()) {
                    return null;
                }

                $token = $res->json('access_token');

                return is_string($token) && $token !== '' ? $token : null;
            } catch (Throwable) {
                return null;
            }
        });
    }

    private function oauthCacheKey(string $scope): string
    {
        return 'fcm:oauth:access_token:'.sha1($scope);
    }

    private function apnsCacheKey(string $apnsToken): string
    {
        return 'fcm:apns:'.hash('sha256', strtolower($apnsToken));
    }

    private function signedJwt(string $scope): string
    {
        $clientEmail = (string) config('services.fcm.client_email');
        $privateKeyPem = $this->normalizedPrivateKey((string) config('services.fcm.private_key'));

        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss' => $clientEmail,
            'sub' => $clientEmail,
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => $scope,
        ];

        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR)),
            $this->base64UrlEncode(json_encode($claims, JSON_THROW_ON_ERROR)),
        ];
        $signingInput = implode('.', $segments);

        $pkey = openssl_pkey_get_private($privateKeyPem);
        if ($pkey === false) {
            throw new \RuntimeException('Invalid FCM private key.');
        }

        $signature = '';
        openssl_sign($signingInput, $signature, $pkey, OPENSSL_ALGO_SHA256);

        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    private function normalizedPrivateKey(string $raw): string
    {
        $key = str_replace('\\n', "\n", $raw);
        $key = trim($key);

        return $key;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
