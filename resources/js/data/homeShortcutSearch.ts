/**
 * Busca dos atalhos da Home e da barra inferior.
 * Os cards continuam definidos na Home; aqui ficam sinônimos, a barra e o ranking.
 * Rotas da barra espelham MobileBottomNav (sem o item Home).
 */

export type HomeBarSearchDestination = {
    id: string;
    label: string;
    subtitle: string;
    route: string;
    featureKey?: string;
    featureAny?: readonly string[];
};

export const homeBarSearchDestinations: readonly HomeBarSearchDestination[] = [
    {
        id: 'oracao',
        label: 'Oração',
        subtitle: 'Pedidos de oração',
        route: 'mobile.prayer',
        featureKey: 'prayer',
    },
    {
        id: 'publicacoes',
        label: 'Publicações',
        subtitle: 'Novidades da igreja',
        route: 'mobile.publications-feed',
    },
    {
        id: 'oferta',
        label: 'Oferta',
        subtitle: 'Dízimo, ofertas e campanhas',
        route: 'mobile.oferta',
        featureAny: ['donation_campaigns', 'offerings'],
    },
    {
        id: 'biblia',
        label: 'Bíblia',
        subtitle: 'Leitura da Bíblia',
        route: 'mobile.bible',
        featureKey: 'bible',
    },
];

/** Sinônimos curtos. Oferta e Doação não compartilham os mesmos termos. */
export const homeShortcutAliases: Record<string, readonly string[]> = {
    enquetes: ['enquete', 'votação', 'pesquisa'],
    'ano-biblico': ['bíblia', 'plano de leitura', 'leitura bíblica'],
    batismo: ['batizar', 'batizado'],
    biblioteca: ['livro', 'livros', 'pdf'],
    'caixa-promessas': ['promessa', 'promessas'],
    'central-servicos': ['serviço', 'serviços'],
    'classe-comecos': ['estudo bíblico', 'começos', 'classe'],
    comunidades: ['whatsapp', 'grupo', 'grupos'],
    conviva: ['check-in', 'checkin', 'presença'],
    culto: ['transmissão', 'culto online'],
    'meditacao-diaria': ['devocional', 'meditação', 'mulher', 'jovem', 'adulto'],
    licao: ['escola sabatina', 'estudo', 'lição'],
    doacao: ['caridade', 'doações'],
    'doar-talentos': ['talento', 'talentos'],
    eventos: ['agenda', 'evento'],
    fotos: ['foto', 'álbum', 'fotógrafo'],
    missao: ['missionário', 'testemunho', 'mural'],
    musica: ['hinário', 'hino', 'cantar', 'louvor'],
    'ns-whats': ['conversa', 'chat', 'conecta'],
    'revista-adventista': ['revista', 'artigos'],
    'vida-e-saude': ['vida', 'saúde', 'saude', 'nutrição', 'bem-estar'],
    saude: ['bem-estar', 'bem estar'],
    series: ['série', 'séries', 'acervo'],
    voluntario: ['voluntariado', 'servir'],
    oracao: ['pedido de oração', 'intercessão', 'orar'],
    publicacoes: ['publicação', 'feed', 'novidades'],
    oferta: ['dízimo', 'dízimos', 'campanha', 'ofertar', 'pacto'],
    biblia: ['escritura', 'versículo', 'versículos'],
};

export type HomeSearchVisibility = {
    featureKey?: string;
    featureAny?: readonly string[];
    leaderOnly?: boolean;
};

export function foldSearchText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function isHomeSearchDestinationVisible(
    item: HomeSearchVisibility,
    isEnabled: (key: string) => boolean,
    isMinistryLeader: boolean,
): boolean {
    if (item.leaderOnly && !isMinistryLeader) {
        return false;
    }

    if (item.featureAny && item.featureAny.length > 0) {
        return item.featureAny.some((key) => isEnabled(key));
    }

    if (item.featureKey) {
        return isEnabled(item.featureKey);
    }

    return true;
}

function words(value: string): string[] {
    return value.split(' ').filter((word) => word.length > 0);
}

/** Uma troca, uma letra a mais ou a menos, ou duas letras vizinhas trocadas. */
function withinOneEdit(a: string, b: string): boolean {
    if (a === b) {
        return false;
    }

    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > 1) {
        return false;
    }

    if (la === lb) {
        let edits = 0;
        for (let i = 0; i < la; i++) {
            if (a[i] === b[i]) {
                continue;
            }

            const swapped =
                edits === 0 && i + 1 < la && a[i] === b[i + 1] && a[i + 1] === b[i];
            if (swapped) {
                edits += 1;
                i += 1;
                continue;
            }

            edits += 1;
            if (edits > 1) {
                return false;
            }
        }

        return edits === 1;
    }

    const shorter = la < lb ? a : b;
    const longer = la < lb ? b : a;
    let i = 0;
    let j = 0;
    let skipped = false;

    while (i < shorter.length && j < longer.length) {
        if (shorter[i] === longer[j]) {
            i += 1;
            j += 1;
            continue;
        }

        if (skipped) {
            return false;
        }

        skipped = true;
        j += 1;
    }

    return true;
}

function aliasList(id: string): string[] {
    return (homeShortcutAliases[id] ?? []).map((alias) => foldSearchText(alias));
}

export function homeShortcutScore(
    entry: { id: string; label: string; subtitle: string },
    query: string,
): number {
    const q = foldSearchText(query);
    if (q === '') {
        return 0;
    }

    const label = foldSearchText(entry.label);
    const subtitle = foldSearchText(entry.subtitle);
    const aliases = aliasList(entry.id);
    const labelWords = words(label);

    if (label === q) {
        return 100;
    }

    if (label.startsWith(q)) {
        return 80;
    }

    if (labelWords.some((word) => word.startsWith(q))) {
        return 70;
    }

    const aliasEquals = aliases.some((alias) => alias === q);
    if (aliasEquals) {
        return 65;
    }

    const aliasStarts = aliases.some(
        (alias) => alias.startsWith(q) || words(alias).some((word) => word.startsWith(q)),
    );
    if (aliasStarts) {
        return 60;
    }

    const contained =
        label.includes(q) || subtitle.includes(q) || aliases.some((alias) => alias.includes(q));
    if (contained) {
        return 40;
    }

    if (q.length < 4) {
        return 0;
    }

    if (labelWords.some((word) => withinOneEdit(word, q))) {
        return 25;
    }

    const pool = [...words(subtitle), ...aliases.flatMap(words)];
    if (pool.some((word) => withinOneEdit(word, q))) {
        return 20;
    }

    return 0;
}

export function rankHomeShortcuts<T extends { id: string; label: string; subtitle: string }>(
    entries: readonly T[],
    query: string,
    limit = 6,
): T[] {
    return entries
        .map((entry) => ({ entry, score: homeShortcutScore(entry, query) }))
        .filter((item) => item.score > 0)
        .sort(
            (a, b) =>
                b.score - a.score || a.entry.label.localeCompare(b.entry.label, 'pt'),
        )
        .slice(0, limit)
        .map((item) => item.entry);
}
