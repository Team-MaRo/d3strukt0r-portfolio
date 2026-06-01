import type {Plugin} from 'vite';
import {copyFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';

// Emits the SPA-fallback 404.html (a verbatim copy of index.html) so GitHub
// Pages serves the SPA shell on any deep URL — without this, a direct hit on
// /anything-not-/ would return GH Pages' default 404 instead of letting the
// React Router not-found route render.
//
// Targets `build/client` directly: react-router writes `index.html` there late
// in the SPA build (its "SPA Mode: Generated …" step), and the resolved Vite
// config's per-environment outDir flips to `build/server` during the prerender
// pass — so a fixed `build/client` is the only reliable target. SSR builds emit
// no `index.html` there (the server renders HTML on the fly), so the existsSync
// guard makes this a no-op.
export function spaFallback(): Plugin {
  const outDir = join(process.cwd(), 'build', 'client');
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      const indexHtml = join(outDir, 'index.html');
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, join(outDir, '404.html'));
        this.info('SPA Mode: Copied index.html → build/client/404.html (GitHub Pages SPA fallback)');
      }
    },
  };
}
