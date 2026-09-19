import { copyFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Fallback visível no cliente quando o servidor não envia appVersion (ex.: deploy sem pasta android/). */
function readAndroidVersionNameForDefine() {
    try {
        const gradle = readFileSync(path.join(__dirname, 'android/app/build.gradle'), 'utf8');
        const m = gradle.match(/versionName\s+["']([^"']+)["']/);
        return m ? m[1].trim() : '';
    } catch {
        return '';
    }
}

const frontBundleVersionHint =
    process.env.VITE_APP_DISPLAY_VERSION?.trim() || readAndroidVersionNameForDefine() || '';

/** Worker do PDF.js em `.js` na mesma origem (nginx recusa `.mjs` como módulo). */
function copyPdfjsWorkerPlugin() {
    const dest = path.join(__dirname, 'public/pdf.worker.min.js');
    const copy = () => {
        const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
        copyFileSync(src, dest);
    };

    return {
        name: 'copy-pdfjs-worker',
        buildStart() {
            copy();
        },
        configureServer() {
            copy();
        },
        closeBundle() {
            copy();
        },
    };
}

export default defineConfig({
    define: {
        __APP_FRONT_BUNDLE_VERSION__: JSON.stringify(frontBundleVersionHint),
    },
    plugins: [
        tailwindcss(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        copyPdfjsWorkerPlugin(),
    ],
    build: {
        rollupOptions: {
            output: {
                // `.mjs` no nginx sai como application/octet-stream; o browser
                // recusa o import dinâmico do worker do PDF.js. Emitir como .js.
                assetFileNames(assetInfo) {
                    const names = assetInfo.names ?? (assetInfo.name ? [assetInfo.name] : []);
                    if (names.some((name) => name.endsWith('.mjs'))) {
                        return 'assets/[name]-[hash].js';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
    },
});
