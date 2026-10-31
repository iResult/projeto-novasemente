<?php

namespace Tests\Feature;

use App\Models\BibleBook;
use App\Models\BibleVerse;
use App\Models\User;
use App\Models\UserBibleVerseMark;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BibleVerseMarkTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_bible_has_no_marks_and_cannot_toggle(): void
    {
        $this->get(route('mobile.bible'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Bible')
                ->where('markedVerses', []));

        $this->postJson(route('mobile.bible.marks.toggle'), [
            'book' => 'jo-43',
            'chapter' => 3,
            'verse' => 16,
        ])->assertUnauthorized();
    }

    public function test_user_can_mark_list_and_unmark_a_verse(): void
    {
        $user = User::factory()->create();
        $book = $this->createBook();
        BibleVerse::query()->create([
            'book_id' => $book->id,
            'chapter' => 3,
            'verse' => 16,
            'text' => 'Porque Deus amou o mundo.',
        ]);
        BibleVerse::query()->create([
            'book_id' => $book->id,
            'chapter' => 1,
            'verse' => 1,
            'text' => 'No princípio era o Verbo.',
        ]);

        $this->actingAs($user)
            ->postJson(route('mobile.bible.marks.toggle'), [
                'book' => 'jo-43',
                'chapter' => 3,
                'verse' => 16,
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('marked', true)
            ->assertJsonPath('markedVerses.0.bookKey', 'jo-43')
            ->assertJsonPath('markedVerses.0.chapter', 3)
            ->assertJsonPath('markedVerses.0.verse', 16);

        $this->assertDatabaseHas('user_bible_verse_marks', [
            'user_id' => $user->id,
            'book_key' => 'jo-43',
            'chapter' => 3,
            'verse' => 16,
        ]);

        $this->actingAs($user)
            ->postJson(route('mobile.bible.marks.toggle'), [
                'book' => 'jo-43',
                'chapter' => 1,
                'verse' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('marked', true);

        $this->actingAs($user)
            ->getJson(route('mobile.bible.marks'))
            ->assertOk()
            ->assertJsonPath('marks.0.ref', 'João 1:1')
            ->assertJsonPath('marks.0.text', 'No princípio era o Verbo.')
            ->assertJsonPath('marks.1.ref', 'João 3:16')
            ->assertJsonPath('marks.1.text', 'Porque Deus amou o mundo.');

        $this->actingAs($user)
            ->get(route('mobile.bible'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mobile/Bible')
                ->has('markedVerses', 2)
                ->where('markedVerses.0.bookKey', 'jo-43')
                ->where('markedVerses.0.verse', 1));

        $this->actingAs($user)
            ->postJson(route('mobile.bible.marks.toggle'), [
                'book' => 'jo-43',
                'chapter' => 3,
                'verse' => 16,
            ])
            ->assertOk()
            ->assertJsonPath('marked', false);

        $this->assertSame(1, UserBibleVerseMark::query()->where('user_id', $user->id)->count());
        $this->assertDatabaseMissing('user_bible_verse_marks', [
            'user_id' => $user->id,
            'book_key' => 'jo-43',
            'chapter' => 3,
            'verse' => 16,
        ]);
    }

    public function test_toggle_rejects_a_verse_that_does_not_exist(): void
    {
        $user = User::factory()->create();
        $this->createBook();

        $this->actingAs($user)
            ->postJson(route('mobile.bible.marks.toggle'), [
                'book' => 'jo-43',
                'chapter' => 3,
                'verse' => 16,
            ])
            ->assertStatus(422)
            ->assertJsonPath('ok', false);

        $this->assertSame(0, UserBibleVerseMark::query()->count());
    }

    private function createBook(): BibleBook
    {
        return BibleBook::query()->create([
            'key' => 'jo-43',
            'abbrev' => 'jo',
            'name' => 'João',
            'testament' => 'new',
            'position' => 43,
            'chapters_count' => 21,
        ]);
    }
}
