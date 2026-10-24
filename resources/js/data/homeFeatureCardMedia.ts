export type HomeCardCrop = 'bottom' | 'side';
export type HomeCardWave = 0 | 1 | 2;

export type HomeCardMedia = {
    src: string;
    crop: HomeCardCrop;
    wave: HomeCardWave;
    /** Posição do assunto dentro do card. A foto cobre o card inteiro. */
    focus?: string;
};

/** Fotos locais dos cards da Home. O recorte fica no componente, não na imagem. */
export const homeFeatureCardMedia: Record<string, HomeCardMedia> = {
    enquetes: { src: '/images/home-cards/enquetes.webp', crop: 'bottom', wave: 0, focus: 'center 72%' },
    'ano-biblico': { src: '/images/home-cards/ano-biblico.webp', crop: 'bottom', wave: 1, focus: 'center 70%' },
    batismo: { src: '/images/home-cards/batismo.webp', crop: 'bottom', wave: 2, focus: 'center 58%' },
    biblioteca: { src: '/images/home-cards/biblioteca.webp', crop: 'bottom', wave: 0, focus: 'center 78%' },
    biblia: { src: '/images/home-cards/biblia.webp', crop: 'bottom', wave: 1, focus: 'center 68%' },
    'caixa-promessas': { src: '/images/home-cards/caixa-promessas.webp', crop: 'bottom', wave: 2, focus: 'center 76%' },
    'central-servicos': { src: '/images/home-cards/central-servicos.webp', crop: 'bottom', wave: 0, focus: 'center 62%' },
    'classe-comecos': { src: '/images/home-cards/classe-comecos.webp', crop: 'bottom', wave: 1, focus: 'center 66%' },
    comunidades: { src: '/images/home-cards/comunidades.webp', crop: 'bottom', wave: 2, focus: 'center 64%' },
    culto: { src: '/images/home-cards/culto.webp', crop: 'bottom', wave: 0, focus: 'center 60%' },
    'meditacao-diaria': { src: '/images/home-cards/meditacao-diaria.webp', crop: 'bottom', wave: 1, focus: 'center 70%' },
    licao: { src: '/images/home-cards/licao.webp', crop: 'bottom', wave: 2, focus: 'center 68%' },
    doacao: { src: '/images/home-cards/doacao.webp', crop: 'bottom', wave: 0, focus: 'center 62%' },
    'doar-talentos': { src: '/images/home-cards/doar-talentos.webp', crop: 'bottom', wave: 1, focus: 'center 60%' },
    eventos: { src: '/images/home-cards/eventos.webp', crop: 'bottom', wave: 2, focus: 'center 58%' },
    fotos: { src: '/images/home-cards/fotos.webp', crop: 'bottom', wave: 0, focus: 'center 64%' },
    missao: { src: '/images/home-cards/missao.webp', crop: 'bottom', wave: 1, focus: 'center 62%' },
    musica: { src: '/images/home-cards/musica.webp', crop: 'bottom', wave: 2, focus: 'center 58%' },
    'ns-whats': { src: '/images/home-cards/ns-whats.webp', crop: 'bottom', wave: 0, focus: 'center 66%' },
    oracao: { src: '/images/home-cards/oracao.webp', crop: 'bottom', wave: 1, focus: 'center 58%' },
    'revista-adventista': { src: '/images/home-cards/revista-adventista.webp', crop: 'bottom', wave: 2, focus: 'center 62%' },
    saude: { src: '/images/home-cards/saude.webp', crop: 'bottom', wave: 0, focus: 'center 64%' },
    series: { src: '/images/home-cards/series.webp', crop: 'bottom', wave: 1, focus: 'center 60%' },
    conheca: { src: '/images/home-cards/conheca.webp', crop: 'side', wave: 0, focus: 'center 46%' },
    voluntario: { src: '/images/home-cards/voluntario.webp', crop: 'bottom', wave: 1, focus: 'center 62%' },
};
