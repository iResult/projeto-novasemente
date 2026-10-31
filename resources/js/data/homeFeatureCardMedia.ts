export type HomeCardCrop = 'bottom' | 'side';
export type HomeCardWave = 0 | 1 | 2;
export type HomeCardTone = 'live';
export type HomeCardTextTheme = 'light' | 'dark';
export type HomeCardGradient = 'none' | 'soft' | 'read';

export type HomeCardMedia = {
    src: string;
    crop: HomeCardCrop;
    wave: HomeCardWave;
    /** Posição do assunto dentro do card. A foto cobre o card inteiro. */
    focus?: string;
    /** Fotos reais de culto: o mesmo filtro nos dois cards. */
    tone?: HomeCardTone;
};

/** Ajuste de uma foto no card, sem duplicar o componente. */
export type HomeCardPresentation = {
    image: string;
    imagePosition?: string;
    textTheme?: HomeCardTextTheme;
    gradientVariant?: HomeCardGradient;
    fallbackImage?: string;
};

/** Fotos locais dos cards da Home. O recorte fica no componente, não na imagem. */
export const homeFeatureCardMedia: Record<string, HomeCardMedia> = {
    enquetes: { src: '/images/home-cards/enquetes.webp?v=4', crop: 'bottom', wave: 0, focus: 'center 70%' },
    'ano-biblico': { src: '/images/home-cards/ano-biblico.webp?v=4', crop: 'bottom', wave: 1, focus: 'center 70%' },
    batismo: { src: '/images/home-cards/batismo.webp', crop: 'bottom', wave: 2, focus: 'center 58%' },
    biblioteca: { src: '/images/home-cards/biblioteca.webp?v=4', crop: 'bottom', wave: 0, focus: 'center 62%' },
    biblia: { src: '/images/home-cards/biblia.webp?v=4', crop: 'bottom', wave: 1, focus: 'center 68%' },
    'caixa-promessas': { src: '/images/home-cards/caixa-promessas.webp?v=4', crop: 'bottom', wave: 2, focus: 'center 40%' },
    'central-servicos': { src: '/images/home-cards/central-servicos.webp', crop: 'bottom', wave: 0, focus: 'center 62%' },
    'classe-comecos': { src: '/images/home-cards/classe-comecos.webp', crop: 'bottom', wave: 1, focus: 'center 66%' },
    comunidades: { src: '/images/home-cards/comunidades.webp?v=4', crop: 'bottom', wave: 2, focus: 'center 62%' },
    culto: { src: '/images/home-cards/culto.webp?v=3', crop: 'bottom', wave: 0, focus: 'center 68%' },
    'meditacao-diaria': { src: '/images/home-cards/meditacao-diaria.webp?v=4', crop: 'bottom', wave: 1, focus: 'center 68%' },
    licao: { src: '/images/home-cards/licao.webp?v=4', crop: 'bottom', wave: 2, focus: 'center 70%' },
    doacao: { src: '/images/home-cards/doacao.webp', crop: 'bottom', wave: 0, focus: 'center 62%' },
    'doar-talentos': { src: '/images/home-cards/doar-talentos.webp', crop: 'bottom', wave: 1, focus: 'center 60%' },
    eventos: { src: '/images/home-cards/eventos.webp', crop: 'bottom', wave: 2, focus: 'center 58%' },
    fotos: { src: '/images/home-cards/fotos.webp', crop: 'bottom', wave: 0, focus: 'center 64%' },
    missao: { src: '/images/home-cards/missao.webp?v=4', crop: 'bottom', wave: 1, focus: 'center 40%' },
    musica: { src: '/images/home-cards/musica.webp?v=3', crop: 'bottom', wave: 2, focus: 'center 62%' },
    'ns-whats': { src: '/images/home-cards/ns-whats.webp', crop: 'bottom', wave: 0, focus: 'center 66%' },
    oracao: { src: '/images/home-cards/oracao.webp', crop: 'bottom', wave: 1, focus: 'center 58%' },
    'revista-adventista': { src: '/images/home-cards/revista-adventista.webp', crop: 'bottom', wave: 2, focus: 'center 62%' },
    'vida-e-saude': { src: '/images/home-cards/vida-e-saude.webp', crop: 'bottom', wave: 1, focus: 'center 40%' },
    saude: { src: '/images/home-cards/saude.webp', crop: 'bottom', wave: 0, focus: 'center 64%' },
    series: { src: '/images/home-cards/series.webp', crop: 'bottom', wave: 1, focus: 'center 60%' },
    conheca: { src: '/images/home-cards/conheca.webp?v=2', crop: 'side', wave: 0, focus: 'center center' },
    voluntario: { src: '/images/home-cards/voluntario.webp', crop: 'bottom', wave: 1, focus: 'center 62%' },
};
