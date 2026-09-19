import { GlobalWorkerOptions, getDocument, version as pdfjsVersion, type PDFDocumentProxy } from 'pdfjs-dist';

const PDF_WORKER_PUBLIC_PATH = '/pdf.worker.min.js';

/**
 * Worker na mesma origem, com extensão `.js`.
 *
 * Em produção o nginx serve `.mjs` como `application/octet-stream`, e o PDF.js
 * falha o import do worker ("Setting up fake worker failed"). O `?worker` do
 * Vite aponta para a porta do Vite em dev (origem diferente da página Laravel)
 * e o browser recusa o Worker. Copiamos o ficheiro para `public/` no Vite.
 */
function configurePdfWorker(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const workerSrc = `${PDF_WORKER_PUBLIC_PATH}?v=${encodeURIComponent(pdfjsVersion)}`;
    if (GlobalWorkerOptions.workerSrc === workerSrc) {
        return;
    }

    GlobalWorkerOptions.workerPort = null;
    GlobalWorkerOptions.workerSrc = workerSrc;
}

export async function fetchPdfBytes(url: string): Promise<{ bytes: ArrayBuffer; byteLength: number }> {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`Não foi possível carregar o PDF (${response.status}).`);
    }

    const bytes = await response.arrayBuffer();
    return { bytes, byteLength: bytes.byteLength };
}

export async function loadPdfDocument(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
    configurePdfWorker();
    return getDocument({ data: new Uint8Array(bytes) }).promise;
}

export function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new DOMException('Extração cancelada.', 'AbortError');
    }
}
