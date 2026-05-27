import type {Plugin} from 'vite';
import {WEB_MANIFEST, WEB_MANIFEST_ICONS} from '../../config/web-manifest';

interface Options {
  // Output filename emitted to the client build root. Browser
  // `<link rel="manifest">` references this. Defaults to
  // `site.webmanifest`.
  out?: string;
}

// Emits the PWA web app manifest at build time and serves it from
// `configureServer` during `vite dev`. Replaces the hand-maintained
// `public/site.webmanifest`. The icon set is shared with `favicon-rasters`
// via `app/config/web-manifest.ts` so the two stay consistent from one
// source. Without the dev-time route, `vite dev` 404s the request, the
// browser receives the HTML 404 page, parses it as JSON, and logs
// `Manifest: Line: 1, column: 1, Syntax error.`
export function webManifest(opts: Options = {}): Plugin {
  const out = opts.out ?? 'site.webmanifest';
  const route = `/${out}`;

  function buildManifest(): string {
    const manifest = {
      ...WEB_MANIFEST,
      icons: WEB_MANIFEST_ICONS.map((icon) => ({
        src: `/${icon.out}`,
        sizes: `${icon.size}x${icon.size}`,
        type: 'image/png',
        ...(icon.purpose === undefined ? {} : {purpose: icon.purpose}),
      })),
    };
    return `${JSON.stringify(manifest, null, 2)}\n`;
  }

  return {
    name: 'web-manifest',
    applyToEnvironment: (env) => env.name === 'client',
    configureServer(server) {
      server.middlewares.use(route, (_req, res) => {
        try {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.end(buildManifest());
        } catch (err) {
          server.config.logger.error(`[web-manifest] ${(err as Error).message}`);
          res.statusCode = 500;
          res.end(`/* ${(err as Error).message} */`);
        }
      });
      server.config.logger.info(`✓ [web-manifest] Exposed new route: ${route}`);
    },
    generateBundle() {
      this.emitFile({type: 'asset', fileName: out, source: buildManifest()});
    },
  };
}
