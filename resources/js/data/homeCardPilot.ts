import type { HomeCardPresentation } from '@/data/homeFeatureCardMedia';

/** Duas colunas: uma foto, um card claro, e a linha seguinte inverte. */
export const HOME_CARD_MOSAIC_COLUMNS = 2;

/**
 * Fotos escolhidas para o mosaico.
 * Os demais cards ficam claros.
 */
export const homeCardPhotoPresentation: Record<string, HomeCardPresentation> = {
    batismo: {
        image: '/images/home-cards-pilot/batismo.jpg?v=5',
        imagePosition: 'center bottom',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    'classe-comecos': {
        image: '/images/home-cards-pilot/estudo.jpg?v=1',
        imagePosition: 'center bottom',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    comunidades: {
        image: '/images/home-cards-pilot/comunidades.jpg?v=1',
        imagePosition: 'center center',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    culto: {
        image: '/images/home-cards-pilot/culto.jpg?v=3',
        imagePosition: 'center bottom',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    eventos: {
        image: '/images/home-cards-pilot/eventos.jpg?v=2',
        imagePosition: 'center center',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    fotos: {
        image: '/images/home-cards-pilot/fotos.jpg?v=1',
        imagePosition: 'center center',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    musica: {
        image: '/images/home-cards-pilot/musica.jpg?v=2',
        imagePosition: 'center top',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
    series: {
        image: '/images/home-cards-pilot/series.jpg?v=1',
        imagePosition: 'center bottom',
        textTheme: 'light',
        gradientVariant: 'soft',
    },
};

/** @deprecated Use homeCardPhotoPresentation. Mantido para imports antigos. */
export const homeCardPilotPresentation = homeCardPhotoPresentation;

export function homeCardMosaicIsPhotoSlot(index: number): boolean {
    const row = Math.floor(index / HOME_CARD_MOSAIC_COLUMNS);
    const column = index % HOME_CARD_MOSAIC_COLUMNS;

    return (row + column) % 2 === 0;
}

/** Intercala foto e card claro. A linha de baixo começa pelo lado oposto. */
export function arrangeHomeCardMosaic<T extends { id: string; label: string }>(items: T[]): T[] {
    const byLabel = (a: T, b: T) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
    const photos = items.filter((item) => homeCardPhotoPresentation[item.id]).sort(byLabel);
    const plains = items.filter((item) => !homeCardPhotoPresentation[item.id]).sort(byLabel);
    const arranged: T[] = [];
    let photoIndex = 0;
    let plainIndex = 0;

    for (let index = 0; index < items.length; index += 1) {
        const usePhoto = homeCardMosaicIsPhotoSlot(index) && photoIndex < photos.length;
        if (usePhoto) {
            arranged.push(photos[photoIndex]);
            photoIndex += 1;
            continue;
        }
        if (plainIndex < plains.length) {
            arranged.push(plains[plainIndex]);
            plainIndex += 1;
            continue;
        }
        if (photoIndex < photos.length) {
            arranged.push(photos[photoIndex]);
            photoIndex += 1;
        }
    }

    return arranged;
}
