<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeCardsPilotTest extends TestCase
{
    use RefreshDatabase;

    public function test_pilot_is_available_and_home_stays_the_official_screen(): void
    {
        $this->get(route('mobile.home-cards-pilot'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Mobile/HomeCardsPilot'));

        $this->get(route('mobile.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Mobile/Home'));
    }
}
