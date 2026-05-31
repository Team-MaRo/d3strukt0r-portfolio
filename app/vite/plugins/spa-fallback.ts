import type {Plugin} from 'vite';
import {copyFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

interface Options {
  outDir: string;
}

// Emits the SPA-fallback 404.html (a verbatim copy of index.html) so GitHub
// Pages serves the SPA shell on any deep URL — without this, a direct hit
// on /anything-not-/  would return GH Pages' default 404 instead of letting
// the React Router not-found route render. SSR builds emit no index.html
// in this dir (the server generates HTML on the fly), so the existsSync
// guard naturally turns this into a no-op there.
export function spaFallback(opts: Options): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      const indexHtml = join(opts.outDir, 'index.html');
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, join(opts.outDir, '404.html'));
      }
    },
  };
}
