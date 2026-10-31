import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { appToast } from '@/utils/appToast';

export type BibleVerseMarkKey = {
    bookKey: string;
    chapter: number;
    verse: number;
};

export type BibleVerseMark = BibleVerseMarkKey & {
    bookName: string;
    ref: string;
    text: string;
};

type StoredMark = BibleVerseMark & { markedAt: number };

const STORAGE_KEY = 'ns:bible:marks:v1';

export type BibleVerseMarkInput = {
    bookKey: string;
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
};

function sameMark(a: BibleVerseMarkKey, b: BibleVerseMarkKey): boolean {
    return a.bookKey === b.bookKey && a.chapter === b.chapter && a.verse === b.verse;
}

function toKey(mark: BibleVerseMarkKey): BibleVerseMarkKey {
    return { bookKey: mark.bookKey, chapter: mark.chapter, verse: mark.verse };
}

export function normalizeBibleVerseMarkKeys(raw: unknown): BibleVerseMarkKey[] {
    if (!Array.isArray(raw)) return [];

    const seen = new Set<string>();
    const keys: BibleVerseMarkKey[] = [];

    for (const row of raw) {
        if (!row || typeof row !== 'object') continue;
        const item = row as Partial<BibleVerseMarkKey>;
        const bookKey = typeof item.bookKey === 'string' ? item.bookKey.trim() : '';
        const chapter = Number(item.chapter);
        const verse = Number(item.verse);
        if (!bookKey || !Number.isFinite(chapter) || chapter < 1 || !Number.isFinite(verse) || verse < 1) {
            continue;
        }
        const identity = `${bookKey}:${chapter}:${verse}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        keys.push({ bookKey, chapter, verse });
    }

    return keys;
}

function readLocalMarks(): BibleVerseMark[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];

        const marks: StoredMark[] = [];
        for (const row of parsed) {
            if (!row || typeof row !== 'object') continue;
            const item = row as Partial<StoredMark>;
            const bookKey = typeof item.bookKey === 'string' ? item.bookKey.trim() : '';
            const bookName = typeof item.bookName === 'string' ? item.bookName.trim() : '';
            const text = typeof item.text === 'string' ? item.text : '';
            const chapter = Number(item.chapter);
            const verse = Number(item.verse);
            const markedAt = Number(item.markedAt);
            if (!bookKey || !bookName || text.trim() === '' || !Number.isFinite(chapter) || chapter < 1 || !Number.isFinite(verse) || verse < 1) {
                continue;
            }
            marks.push({
                bookKey,
                bookName,
                chapter,
                verse,
                text,
                ref: `${bookName} ${chapter}:${verse}`,
                markedAt: Number.isFinite(markedAt) ? markedAt : 0,
            });
        }

        marks.sort((a, b) => b.markedAt - a.markedAt);

        return marks.map(({ bookKey, bookName, chapter, verse, text, ref }) => ({
            bookKey,
            bookName,
            chapter,
            verse,
            text,
            ref,
        }));
    } catch {
        return [];
    }
}

function writeLocalMarks(marks: BibleVerseMark[]): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const now = Date.now();
        const payload: StoredMark[] = marks.map((mark, index) => ({
            ...mark,
            markedAt: now - index,
        }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return true;
    } catch {
        return false;
    }
}

function withoutMark(marks: BibleVerseMark[], target: BibleVerseMarkKey): BibleVerseMark[] {
    return marks.filter((mark) => !sameMark(mark, target));
}

export type BibleVerseMarkGroup = {
    bookKey: string;
    bookName: string;
    chapter: number;
    startVerse: number;
    endVerse: number;
    ref: string;
    marks: BibleVerseMark[];
};

/** Junta versículos seguidos do mesmo capítulo (1, 2 e 3 viram 1-3). */
export function groupConsecutiveBibleMarks(marks: BibleVerseMark[]): BibleVerseMarkGroup[] {
    const byChapter = new Map<string, BibleVerseMark[]>();
    const chapterOrder: string[] = [];

    marks.forEach((mark) => {
        const key = `${mark.bookKey}:${mark.chapter}`;
        const list = byChapter.get(key);
        if (!list) {
            byChapter.set(key, [mark]);
            chapterOrder.push(key);
            return;
        }
        list.push(mark);
    });

    const groups: Array<BibleVerseMarkGroup & { rank: number }> = [];

    chapterOrder.forEach((key) => {
        const sorted = [...(byChapter.get(key) ?? [])].sort((a, b) => a.verse - b.verse);
        let run: BibleVerseMark[] = [];

        const flush = () => {
            if (run.length === 0) return;
            const start = run[0];
            const end = run[run.length - 1];
            const rank = Math.min(...run.map((mark) => marks.indexOf(mark)));
            groups.push({
                bookKey: start.bookKey,
                bookName: start.bookName,
                chapter: start.chapter,
                startVerse: start.verse,
                endVerse: end.verse,
                ref:
                    start.verse === end.verse
                        ? `${start.bookName} ${start.chapter}:${start.verse}`
                        : `${start.bookName} ${start.chapter}:${start.verse}-${end.verse}`,
                marks: run,
                rank,
            });
            run = [];
        };

        sorted.forEach((mark) => {
            const previous = run[run.length - 1];
            if (previous && mark.verse !== previous.verse + 1) flush();
            run.push(mark);
        });
        flush();
    });

    return groups.sort((a, b) => a.rank - b.rank).map(({ rank: _rank, ...group }) => group);
}

export function useBibleVerseMarks(initialKeys: BibleVerseMarkKey[]) {
    const page = usePage();
    const csrfProp = (page.props as { csrf_token?: string }).csrf_token;
    const user = (page.props as { auth?: { user?: { id?: number } | null } }).auth?.user ?? null;
    const persistOnServer = Boolean(user);

    const [keys, setKeys] = useState<BibleVerseMarkKey[]>(() => (persistOnServer ? normalizeBibleVerseMarkKeys(initialKeys) : []));
    const [localMarks, setLocalMarks] = useState<BibleVerseMark[]>([]);
    const [serverMarks, setServerMarks] = useState<BibleVerseMark[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [listStatus, setListStatus] = useState<'idle' | 'loading' | 'error'>('idle');

    const busyRef = useRef(false);
    const keysRef = useRef(keys);
    const localMarksRef = useRef(localMarks);
    const serverMarksRef = useRef(serverMarks);
    keysRef.current = keys;
    localMarksRef.current = localMarks;
    serverMarksRef.current = serverMarks;

    const initialKey = JSON.stringify(normalizeBibleVerseMarkKeys(initialKeys));

    useEffect(() => {
        if (!persistOnServer) return;
        setKeys(normalizeBibleVerseMarkKeys(JSON.parse(initialKey) as unknown));
    }, [persistOnServer, initialKey]);

    useEffect(() => {
        if (persistOnServer) return;
        const stored = readLocalMarks();
        setLocalMarks(stored);
        setKeys(stored.map(toKey));
    }, [persistOnServer]);

    const isMarked = useCallback(
        (bookKey: string, chapter: number, verse: number) => keys.some((key) => sameMark(key, { bookKey, chapter, verse })),
        [keys],
    );

    const loadList = useCallback(async () => {
        if (!persistOnServer) {
            const stored = readLocalMarks();
            setLocalMarks(stored);
            setKeys(stored.map(toKey));
            setListStatus('idle');
            return;
        }

        setListStatus('loading');
        try {
            const response = await fetch(route('mobile.bible.marks'), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const data = (await response.json()) as { ok?: boolean; marks?: BibleVerseMark[] };
            if (!response.ok || !data.ok || !Array.isArray(data.marks)) {
                throw new Error('bad');
            }
            setServerMarks(data.marks);
            setKeys(data.marks.map(toKey));
            setListStatus('idle');
        } catch {
            setListStatus('error');
        }
    }, [persistOnServer]);

    const toggle = useCallback(
        async (input: BibleVerseMarkInput) => {
            if (busyRef.current) return;

            const row: BibleVerseMark = {
                bookKey: input.bookKey,
                bookName: input.bookName,
                chapter: input.chapter,
                verse: input.verse,
                text: input.text,
                ref: `${input.bookName} ${input.chapter}:${input.verse}`,
            };
            const markedNow = keysRef.current.some((key) => sameMark(key, input));

            if (!persistOnServer) {
                const next = markedNow
                    ? withoutMark(localMarksRef.current, input)
                    : [row, ...withoutMark(localMarksRef.current, input)];
                if (!writeLocalMarks(next)) {
                    appToast('Não foi possível guardar a marcação.', 'error');
                    return;
                }
                const nextKeys = next.map(toKey);
                localMarksRef.current = next;
                keysRef.current = nextKeys;
                setLocalMarks(next);
                setKeys(nextKeys);
                return;
            }

            const prevKeys = keysRef.current;
            const prevServer = serverMarksRef.current;
            const nextKeys = markedNow
                ? prevKeys.filter((key) => !sameMark(key, input))
                : [toKey(input), ...prevKeys.filter((key) => !sameMark(key, input))];
            const nextServer = prevServer
                ? markedNow
                    ? withoutMark(prevServer, input)
                    : [row, ...withoutMark(prevServer, input)]
                : prevServer;
            keysRef.current = nextKeys;
            serverMarksRef.current = nextServer;
            setKeys(nextKeys);
            if (nextServer) {
                setServerMarks(nextServer);
            }

            busyRef.current = true;
            setBusy(true);
            try {
                const csrf =
                    csrfProp ??
                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
                    '';
                const response = await fetch(route('mobile.bible.marks.toggle'), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        book: input.bookKey,
                        chapter: input.chapter,
                        verse: input.verse,
                    }),
                });
                const data = (await response.json().catch(() => null)) as { markedVerses?: unknown } | null;
                if (!response.ok) {
                    keysRef.current = prevKeys;
                    serverMarksRef.current = prevServer;
                    setKeys(prevKeys);
                    setServerMarks(prevServer);
                    appToast('Não foi possível guardar a marcação.', 'error');
                    return;
                }
                if (data && Array.isArray(data.markedVerses)) {
                    const normalized = normalizeBibleVerseMarkKeys(data.markedVerses);
                    keysRef.current = normalized;
                    setKeys(normalized);
                }
            } catch {
                keysRef.current = prevKeys;
                serverMarksRef.current = prevServer;
                setKeys(prevKeys);
                setServerMarks(prevServer);
                appToast('Não foi possível guardar a marcação.', 'error');
            } finally {
                busyRef.current = false;
                setBusy(false);
            }
        },
        [csrfProp, persistOnServer],
    );

    const marks = persistOnServer ? (serverMarks ?? []) : localMarks;

    return {
        marks,
        count: keys.length,
        busy,
        listStatus,
        isMarked,
        toggle,
        loadList,
    };
}
