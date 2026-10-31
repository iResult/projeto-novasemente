<?php

namespace App\Http\Controllers;

use App\Models\BibleBook;
use App\Models\BibleVerse;
use App\Models\UserBibleVerseMark;
use App\Services\BibleReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class MobileBibleController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedBook = $request->string('book')->toString();
        $selectedBook = $selectedBook !== '' ? $selectedBook : null;
        $selectedChapter = (int) $request->input('chapter', 1);
        $selectedChapter = $selectedChapter > 0 ? $selectedChapter : 1;

        $books = BibleBook::query()
            ->orderBy('position')
            ->get(['id', 'key', 'abbrev', 'name', 'testament', 'position', 'chapters_count'])
            ->map(fn (BibleBook $b) => [
                'id' => $b->id,
                'key' => $b->key,
                'abbrev' => $b->abbrev,
                'name' => $b->name,
                'testament' => $b->testament,
                'position' => (int) $b->position,
                'chapters_count' => (int) $b->chapters_count,
            ])
            ->values()
            ->all();

        $initial = null;
        if ($selectedBook) {
            $book = BibleBook::query()->where('key', $selectedBook)->first();
            if ($book) {
                $chapter = min($selectedChapter, (int) $book->chapters_count);
                $verses = BibleVerse::query()
                    ->where('book_id', $book->id)
                    ->where('chapter', $chapter)
                    ->orderBy('verse')
                    ->get(['verse', 'text'])
                    ->map(fn (BibleVerse $v) => [
                        'verse' => (int) $v->verse,
                        'text' => $v->text,
                    ])
                    ->values()
                    ->all();

                $initial = [
                    'book' => [
                        'key' => $book->key,
                        'abbrev' => $book->abbrev,
                        'name' => $book->name,
                        'testament' => $book->testament,
                        'chapters_count' => (int) $book->chapters_count,
                    ],
                    'chapter' => $chapter,
                    'verses' => $verses,
                ];
            }
        }

        return Inertia::render('Mobile/Bible', [
            'books' => $books,
            'initial' => $initial,
            'markedVerses' => $this->markedVerseKeys($request),
        ]);
    }

    public function marks(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        if (! Schema::hasTable('user_bible_verse_marks')) {
            return response()->json([
                'ok' => true,
                'marks' => [],
            ]);
        }

        $rows = DB::table('user_bible_verse_marks as m')
            ->join('bible_books as b', 'b.key', '=', 'm.book_key')
            ->join('bible_verses as v', function ($join) {
                $join->on('v.book_id', '=', 'b.id')
                    ->on('v.chapter', '=', 'm.chapter')
                    ->on('v.verse', '=', 'm.verse');
            })
            ->where('m.user_id', $user->id)
            ->orderByDesc('m.created_at')
            ->orderByDesc('m.id')
            ->get([
                'm.book_key',
                'b.name as book_name',
                'm.chapter',
                'm.verse',
                'v.text',
            ]);

        $marks = $rows->map(function ($row) {
            $chapter = (int) $row->chapter;
            $verse = (int) $row->verse;
            $bookName = (string) $row->book_name;

            return [
                'bookKey' => (string) $row->book_key,
                'bookName' => $bookName,
                'chapter' => $chapter,
                'verse' => $verse,
                'ref' => sprintf('%s %d:%d', $bookName, $chapter, $verse),
                'text' => (string) $row->text,
            ];
        })->values()->all();

        return response()->json([
            'ok' => true,
            'marks' => $marks,
        ]);
    }

    public function toggleMark(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);
        abort_unless(Schema::hasTable('user_bible_verse_marks'), 503);

        $valid = $request->validate([
            'book' => ['required', 'string', 'max:24'],
            'chapter' => ['required', 'integer', 'min:1', 'max:200'],
            'verse' => ['required', 'integer', 'min:1', 'max:200'],
        ]);

        $book = BibleBook::query()->where('key', $valid['book'])->first();
        $verseExists = $book !== null && BibleVerse::query()
            ->where('book_id', $book->id)
            ->where('chapter', (int) $valid['chapter'])
            ->where('verse', (int) $valid['verse'])
            ->exists();

        if ($book === null || ! $verseExists) {
            return response()->json([
                'ok' => false,
                'message' => 'Versículo não encontrado.',
            ], 422);
        }

        $existing = UserBibleVerseMark::query()
            ->where('user_id', $user->id)
            ->where('book_key', $book->key)
            ->where('chapter', (int) $valid['chapter'])
            ->where('verse', (int) $valid['verse'])
            ->first();

        if ($existing !== null) {
            $existing->delete();
            $marked = false;
        } else {
            UserBibleVerseMark::query()->create([
                'user_id' => $user->id,
                'book_key' => $book->key,
                'chapter' => (int) $valid['chapter'],
                'verse' => (int) $valid['verse'],
            ]);
            $marked = true;
        }

        return response()->json([
            'ok' => true,
            'marked' => $marked,
            'markedVerses' => $this->markedVerseKeys($request),
        ]);
    }

    /**
     * @return list<array{bookKey: string, chapter: int, verse: int}>
     */
    private function markedVerseKeys(Request $request): array
    {
        $user = $request->user();
        if ($user === null || ! Schema::hasTable('user_bible_verse_marks')) {
            return [];
        }

        return UserBibleVerseMark::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['book_key', 'chapter', 'verse'])
            ->map(fn (UserBibleVerseMark $mark) => [
                'bookKey' => $mark->book_key,
                'chapter' => (int) $mark->chapter,
                'verse' => (int) $mark->verse,
            ])
            ->values()
            ->all();
    }

    public function chapter(Request $request)
    {
        $valid = $request->validate([
            'book' => ['required', 'string', 'max:24'],
            'chapter' => ['required', 'integer', 'min:1', 'max:200'],
        ]);

        $book = BibleBook::query()->where('key', $valid['book'])->firstOrFail();
        $chapter = min((int) $valid['chapter'], (int) $book->chapters_count);

        $verses = BibleVerse::query()
            ->where('book_id', $book->id)
            ->where('chapter', $chapter)
            ->orderBy('verse')
            ->get(['verse', 'text'])
            ->map(fn (BibleVerse $v) => [
                'verse' => (int) $v->verse,
                'text' => $v->text,
            ])
            ->values()
            ->all();

        return response()->json([
            'ok' => true,
            'book' => [
                'key' => $book->key,
                'abbrev' => $book->abbrev,
                'name' => $book->name,
                'testament' => $book->testament,
                'chapters_count' => (int) $book->chapters_count,
            ],
            'chapter' => $chapter,
            'verses' => $verses,
        ]);
    }

    public function search(Request $request)
    {
        $valid = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'testament' => ['nullable', 'in:old,new'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $q = trim((string) $valid['q']);
        $limit = (int) ($valid['limit'] ?? 20);
        $testament = $valid['testament'] ?? null;

        $query = BibleVerse::query()
            ->select([
                'bible_verses.id',
                'bible_verses.chapter',
                'bible_verses.verse',
                'bible_verses.text',
                'bible_books.key as book_key',
                'bible_books.abbrev as book_abbrev',
                'bible_books.name as book_name',
            ])
            ->join('bible_books', 'bible_books.id', '=', 'bible_verses.book_id')
            ->when($testament, fn ($q2) => $q2->where('bible_books.testament', $testament));

        // Prefer FULLTEXT on MySQL; fallback to LIKE.
        if (DB::getDriverName() === 'mysql') {
            $query->whereRaw('MATCH(bible_verses.text) AGAINST (? IN BOOLEAN MODE)', [$q.'*']);
        } else {
            $query->where('bible_verses.text', 'like', '%'.$q.'%');
        }

        $rows = $query
            ->orderBy('bible_books.position')
            ->orderBy('bible_verses.chapter')
            ->orderBy('bible_verses.verse')
            ->limit($limit)
            ->get();

        $results = $rows->map(function ($r) use ($q) {
            $text = (string) $r->text;
            $pos = mb_stripos($text, $q);
            $start = $pos === false ? 0 : max(0, $pos - 60);
            $snippet = mb_substr($text, $start, 180);
            $snippet = trim($snippet);

            return [
                'ref' => sprintf('%s %d:%d', (string) $r->book_name, (int) $r->chapter, (int) $r->verse),
                'book' => (string) $r->book_key,
                'chapter' => (int) $r->chapter,
                'verse' => (int) $r->verse,
                'text' => $snippet,
            ];
        })->values()->all();

        return response()->json([
            'ok' => true,
            'results' => $results,
        ]);
    }

    public function reference(Request $request, BibleReferenceService $references): JsonResponse
    {
        $valid = $request->validate([
            'ref' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $resolved = $references->resolveReferenceString((string) $valid['ref']);
        if ($resolved === null) {
            return response()->json([
                'ok' => false,
                'error' => 'Referência não encontrada na Bíblia.',
            ], 422);
        }

        return response()->json([
            'ok' => true,
            'ref' => $resolved['ref'],
            'book' => $resolved['book'],
            'chapter' => $resolved['chapter'],
            'verses' => $resolved['verses'],
        ]);
    }
}
