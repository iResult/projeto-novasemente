<?php

namespace App\Http\Controllers;

use App\Models\VidaSaudeArticle;
use App\Models\VidaSaudeCategory;
use App\Services\VidaSaudeSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VidaSaudeArticleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->can('news.view') || $user?->can('news.manage'), 403);

        $canManage = $user?->can('news.manage') ?? false;
        $section = $this->validSection((string) $request->query('section', ''));
        $search = $this->validSearch((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', 'all'));
        if (! in_array($status, ['all', 'active', 'inactive'], true)) {
            $status = 'all';
        }

        $articles = VidaSaudeArticle::query()
            ->with('primaryCategory')
            ->when($section !== '', fn ($q) => $q->whereHas(
                'primaryCategory',
                fn ($category) => $category->where('slug', $section),
            ))
            ->when($search !== '', fn ($q) => $q->search($search))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->paginate(24)
            ->withQueryString();

        $articles->getCollection()->transform(fn (VidaSaudeArticle $article) => $this->listPayload($article));

        return Inertia::render('VidaSaude/Index', [
            'articles' => $articles,
            'canManage' => $canManage,
            'sections' => $this->sectionOptions(),
            'filters' => [
                'section' => $section !== '' ? $section : null,
                'q' => $search !== '' ? $search : null,
                'status' => $status,
            ],
        ]);
    }

    public function setActive(Request $request, VidaSaudeArticle $vidaSaudeArticle): RedirectResponse
    {
        $this->authorize('news.manage');

        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $vidaSaudeArticle->update(['is_active' => (bool) $data['is_active']]);

        return back()->with(
            'success',
            $vidaSaudeArticle->is_active
                ? 'Publicação ativada com sucesso.'
                : 'Publicação desativada com sucesso.'
        );
    }

    public function syncArticles(VidaSaudeSyncService $syncService): RedirectResponse
    {
        $this->authorize('news.manage');

        $result = $syncService->sync();

        if (! ($result['ok'] ?? false)) {
            return back()->with('error', $result['error'] ?? 'Não foi possível sincronizar os artigos da Vida e Saúde.');
        }

        return back()->with(
            'success',
            sprintf(
                'Artigos sincronizados: %d novos, %d atualizados, %d ignorados.',
                $result['created'],
                $result['updated'],
                $result['skipped'],
            ),
        );
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function sectionOptions(): array
    {
        return VidaSaudeCategory::query()
            ->whereHas('primaryArticles')
            ->orderBy('display_position')
            ->orderBy('label')
            ->get()
            ->map(fn (VidaSaudeCategory $category) => [
                'value' => $category->slug,
                'label' => $category->label,
            ])
            ->values()
            ->all();
    }

    private function validSection(string $section): string
    {
        $section = trim($section);
        if ($section === '') {
            return '';
        }

        $exists = VidaSaudeCategory::query()->where('slug', $section)->exists();

        return $exists ? $section : '';
    }

    private function validSearch(string $search): string
    {
        $search = trim($search);
        if (mb_strlen($search) > 0 && mb_strlen($search) < 2) {
            return '';
        }

        return $search;
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(VidaSaudeArticle $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'section' => $article->sectionSlug(),
            'section_label' => $article->sectionLabel(),
            'author_name' => $article->author_name,
            'source_url' => $article->source_url,
            'image_url' => $article->image_url,
            'cover_url' => $article->image_url,
            'published_at' => $article->published_at?->toIso8601String(),
            'feed_released_at' => $article->feed_released_at?->toIso8601String(),
            'is_active' => (bool) $article->is_active,
        ];
    }
}
