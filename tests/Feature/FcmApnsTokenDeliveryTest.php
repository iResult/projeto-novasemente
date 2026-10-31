<?php

namespace Tests\Feature;

use App\Models\PushToken;
use App\Models\User;
use App\Services\FcmMessaging;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FcmApnsTokenDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private string $privateKey;

    protected function setUp(): void
    {
        parent::setUp();

        $key = openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);
        $this->assertNotFalse($key);
        $exported = '';
        openssl_pkey_export($key, $exported);
        $this->privateKey = $exported;

        config([
            'services.fcm.project_id' => 'proj-teste',
            'services.fcm.client_email' => 'svc@teste.iam.gserviceaccount.com',
            'services.fcm.private_key' => $this->privateKey,
            'services.fcm.ios_bundle_id' => 'mobapp.at.novasementeorg',
            'services.fcm.ios_apns_sandbox' => false,
        ]);
    }

    public function test_apns_token_is_exchanged_before_fcm_send(): void
    {
        $apns = str_repeat('ab', 32);
        $sent = [];

        Http::fake(function ($request) use (&$sent) {
            $url = $request->url();
            if (str_contains($url, 'oauth2.googleapis.com')) {
                return Http::response(['access_token' => 'ya29-teste'], 200);
            }
            if (str_contains($url, 'batchImport')) {
                $sent[] = ['import' => $request->data()];

                return Http::response([
                    'results' => [[
                        'status' => 'OK',
                        'registration_token' => 'fcm-vindo-da-apple',
                    ]],
                ], 200);
            }
            if (str_contains($url, 'messages:send')) {
                $sent[] = ['send' => $request->data()];

                return Http::response(['name' => 'projects/proj-teste/messages/1'], 200);
            }

            return Http::response('inesperado', 500);
        });

        $ok = (new FcmMessaging)->sendVisibleNotification($apns, 'Titulo', 'Corpo', ['type' => 'inbox_notification']);

        $this->assertTrue($ok);
        $this->assertSame('mobapp.at.novasementeorg', $sent[0]['import']['application']);
        $this->assertFalse($sent[0]['import']['sandbox']);
        $this->assertSame([$apns], $sent[0]['import']['apns_tokens']);
        $this->assertSame('fcm-vindo-da-apple', $sent[1]['send']['message']['token']);
    }

    public function test_android_token_skips_apns_import(): void
    {
        $android = str_repeat('c', 142);
        $imported = false;

        Http::fake(function ($request) use (&$imported, $android) {
            $url = $request->url();
            if (str_contains($url, 'oauth2.googleapis.com')) {
                return Http::response(['access_token' => 'ya29-teste'], 200);
            }
            if (str_contains($url, 'batchImport')) {
                $imported = true;

                return Http::response(['results' => []], 200);
            }
            if (str_contains($url, 'messages:send')) {
                $this->assertSame($android, $request->data()['message']['token']);

                return Http::response(['name' => 'projects/proj-teste/messages/2'], 200);
            }

            return Http::response('inesperado', 500);
        });

        $this->assertTrue((new FcmMessaging)->sendVisibleNotification($android, 'Titulo', 'Corpo'));
        $this->assertFalse($imported);
    }

    public function test_failed_import_does_not_delete_the_apple_token(): void
    {
        $user = User::factory()->create();
        $apns = str_repeat('cd', 32);
        PushToken::query()->create([
            'user_id' => $user->id,
            'platform' => 'ios',
            'token' => $apns,
        ]);

        Http::fake(function ($request) {
            if (str_contains($request->url(), 'oauth2.googleapis.com')) {
                return Http::response(['access_token' => 'ya29-teste'], 200);
            }

            return Http::response(['results' => [['status' => 'INVALID_ARGUMENT']]], 400);
        });

        $this->assertFalse((new FcmMessaging)->sendVisibleNotification($apns, 'Titulo', 'Corpo'));
        $this->assertDatabaseHas('push_tokens', ['token' => $apns]);
    }

    public function test_unregistered_fcm_token_removes_the_stored_apple_token(): void
    {
        $user = User::factory()->create();
        $apns = str_repeat('ef', 32);
        PushToken::query()->create([
            'user_id' => $user->id,
            'platform' => 'ios',
            'token' => $apns,
        ]);

        Http::fake(function ($request) {
            $url = $request->url();
            if (str_contains($url, 'oauth2.googleapis.com')) {
                return Http::response(['access_token' => 'ya29-teste'], 200);
            }
            if (str_contains($url, 'batchImport')) {
                return Http::response([
                    'results' => [[
                        'status' => 'OK',
                        'registration_token' => 'fcm-morto',
                    ]],
                ], 200);
            }

            return Http::response([
                'error' => [
                    'status' => 'NOT_FOUND',
                    'details' => [['errorCode' => 'UNREGISTERED']],
                ],
            ], 404);
        });

        $this->assertFalse((new FcmMessaging)->sendVisibleNotification($apns, 'Titulo', 'Corpo'));
        $this->assertDatabaseMissing('push_tokens', ['token' => $apns]);
    }
}
