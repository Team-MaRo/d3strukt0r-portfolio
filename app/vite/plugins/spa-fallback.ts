import type {Plugin} from 'vite';
import {copyFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

interface Options {
  outDir: string;
}

// Copies build/client/index.html to 404.html so GitHub Pages serves the SPA
// shell on any deep link (without this, direct hits on /anything/ fail with
// Pages' default 404). The existence check guards SSR builds, which emit no
// index.html in the client dir.
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
