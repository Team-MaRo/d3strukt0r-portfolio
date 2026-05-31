import type {Plugin} from 'vite';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import lodash from 'lodash';
import {parse as parseYaml} from 'yaml';

interface ManifestIcon {
  // Pixel dimension (square) of the icon.
  size: number;
  // Output filename the icon is emitted to (referenced from the manifest as
  // `/<out>`).
  out: string;
  // Optional PWA icon purpose (`maskable` / `any` / `monochrome`).
  purpose?: string;
}

interface Options {
  // Path (relative to project root) of the locale YAML to source the
  // manifest text from.
  locale: string;
  // Output filename emitted to the client build root. Browser
  // `<link rel="manifest">` references this.
  out: string;
  // Dotted property paths into the locale YAML for each text field. `name`
  // is required; `short_name` / `description` are emitted only when both the
  // path is given and the resolved value is a non-empty string.
  keys: {name: string; short_name?: string; description?: string};
  // Static manifest fields merged verbatim (display, theme_color, lang, …).
  manifest: Readonly<Record<string, unknown>>;
  // Icon set, shared with the favicon rasteriser via `vite.config.ts` so the
  // PWA icons and the emitted rasters stay in lockstep.
  icons: readonly ManifestIcon[];
}

// Emits the PWA web app manifest at build time and serves it from
// `configureServer` during `vite dev`. Every concrete value — locale path,
// YAML property paths, static fields, icon set, output filename — is passed
// in from `vite.config.ts`, so this plugin hardcodes nothing and shares no
// config module with `favicon-rasters`. Without the dev-time route, `vite
// dev` 404s the request, the browser receives the HTML 404 page, parses it
// as JSON, and logs `Manifest: Line: 1, column: 1, Syntax error.`
export function webManifest(opts: Options): Plugin {
  const {locale, out, keys, manifest: staticFields, icons} = opts;
  const route = `/${out}`;

  function buildManifest(): string {
    const yaml = parseYaml(readFileSync(join(process.cwd(), locale), 'utf8')) as unknown;
    const name = lodash.get(yaml, keys.name) as unknown;
    if (typeof name !== 'string' || name === '') {
      throw new Error(`[web-manifest] missing ${keys.name} in ${locale}`);
    }
    const shortName = keys.short_name === undefined ? undefined : (lodash.get(yaml, keys.short_name) as unknown);
    const description = keys.description === undefined ? undefined : (lodash.get(yaml, keys.description) as unknown);
    const manifest = {
      name,
      ...(typeof shortName === 'string' && shortName !== '' ? {short_name: shortName} : {}),
      ...(typeof description === 'string' && description !== '' ? {description} : {}),
      ...staticFields,
      icons: icons.map((icon) => ({
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
      let source: string;
      try {
        source = buildManifest();
      } catch (err) {
        this.error((err as Error).message);
      }
      this.emitFile({type: 'asset', fileName: out, source});
    },
  };
}
