import type {Plugin} from 'vite';
import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import {formatHex} from 'culori';
import pngToIco from 'png-to-ico';

interface PngRaster {
  // Pixel dimension (square) to rasterise to.
  size: number;
  // Output filename emitted to the build root.
  out: string;
}

interface Options {
  // Path (relative to project root) of the source SVG. The committed file
  // ships both light + dark variants via a `prefers-color-scheme` <style>
  // block; raster fallbacks here are always the SVG's light-mode rendering.
  source: string;
  // Output filename for the SVG copy emitted to the build root. Browser
  // tab `<link rel="icon">` references this.
  svgOut: string;
  // Output filename for the multi-resolution ICO.
  icoOut: string;
  // Every PNG raster to emit — favicon / apple-touch sizes plus the PWA
  // manifest icons — supplied by the caller in `vite.config.ts` so this
  // plugin shares no config module with `web-manifest`.
  pngs: readonly PngRaster[];
  // Resolutions baked into the multi-image ICO (RealFaviconGenerator embeds
  // 16/32/48 at 32bpp, BMP-encoded for maximum legacy support).
  icoSizes: readonly number[];
}

const WHITESPACE_RE = /\s+/;
const STYLE_BLOCK_RE = /<style[^>]*>([\s\S]*?)<\/style>/i;
const COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const AT_MEDIA_RE = /@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g;
const RULE_RE = /\.([\w-]+)\s*\{([^}]+)\}/g;
const CLASS_ATTR_RE = /class="([^"]+)"/g;

// libvips (used by sharp) does not resolve external CSS rules during SVG
// rasterisation — `.classname { fill: ... }` is ignored, and elements fall
// back to default fill = black. This walks the SVG's own `<style>` block,
// parses the light-mode (non-@media) rules, and injects them as inline
// `fill` / `stroke` / etc. attributes on every element with a matching
// `class="..."` attribute. The original SVG buffer is left untouched so
// the browser-visible SVG keeps its `prefers-color-scheme` `@media` block.
function inlineLightModeStyles(svg: string): string {
  const styleMatch = STYLE_BLOCK_RE.exec(svg);
  if (!styleMatch) {
    return svg;
  }

  const lightBody = styleMatch[1]!
    .replace(COMMENT_RE, '')
    .replace(AT_MEDIA_RE, '');

  const rules = new Map<string, Record<string, string>>();
  for (const m of lightBody.matchAll(RULE_RE)) {
    const cls = m[1]!;
    const decls: Record<string, string> = {};
    for (const decl of m[2]!.split(';')) {
      const colonIdx = decl.indexOf(':');
      if (colonIdx < 0) {
        continue;
      }
      const k = decl.slice(0, colonIdx).trim();
      const v = decl.slice(colonIdx + 1).trim();
      if (k && v) {
        decls[k] = convertValue(k, v);
      }
    }
    rules.set(cls, decls);
  }

  return svg.replace(CLASS_ATTR_RE, (_full, classList: string) => {
    const seen = new Set<string>();
    let extra = '';
    for (const cls of classList.split(WHITESPACE_RE)) {
      const props = rules.get(cls);
      if (!props) {
        continue;
      }
      for (const [k, v] of Object.entries(props)) {
        if (seen.has(k)) {
          continue;
        }
        seen.add(k);
        extra += ` ${k}="${v}"`;
      }
    }
    return `class="${classList}"${extra}`;
  });
}

function convertValue(prop: string, value: string): string {
  if (prop === 'fill' || prop === 'stroke') {
    return formatHex(value) ?? value;
  }
  return value;
}

interface IconAsset {
  fileName: string;
  type: string;
  source: Buffer;
}

// Generates the favicon set (the SVG copy, PNG fallbacks, and a multi-resolution
// ICO) from the source SVG. The PNG set (`opts.pngs`) + ICO resolutions
// (`opts.icoSizes`) are supplied by the caller in `vite.config.ts`, which merges
// the favicon-only sizes with the shared PWA manifest icons so the rasters and
// the manifest stay in lockstep without this plugin importing a config module.
//
// The build emits them via `emitFile` (→ `build/client/`); `vite dev` serves the
// same set from a `configureServer` middleware so the icon URLs don't 404 there.
export function faviconRasters(opts: Options): Plugin {
  const {source, svgOut, icoOut, pngs, icoSizes} = opts;

  // Rasterises the source SVG into the full icon set with content types. Shared
  // by the build (`generateBundle`) and the dev server (`configureServer`).
  async function buildAssets(): Promise<IconAsset[]> {
    const sharp = (await import('sharp')).default;
    const svg = readFileSync(join(process.cwd(), source));

    // Raster pipeline gets a transformed SVG with class-based fills/strokes
    // inlined onto each element (libvips ignores `<style>` rules). Density 384
    // gives sharp headroom to rasterise up to 512px without aliasing.
    const svgForRaster = Buffer.from(inlineLightModeStyles(svg.toString('utf8')), 'utf8');
    const renderPng = async (size: number) => sharp(svgForRaster, {density: 384})
      .resize(size, size, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
      .png()
      .toBuffer();

    // The SVG copy itself, so /favicon.svg keeps working for `<link rel="icon">`.
    const assets: IconAsset[] = [{fileName: svgOut, type: 'image/svg+xml', source: svg}];
    for (const {size, out} of pngs) {
      assets.push({fileName: out, type: 'image/png', source: await renderPng(size)});
    }
    // Multi-resolution favicon.ico — png-to-ico produces BMP-encoded (DIB)
    // entries for maximum browser/OS compatibility (pre-Vista Windows + older
    // shells can't read PNG-in-ICO).
    const icoPngs = await Promise.all(icoSizes.map(async (s) => renderPng(s)));
    assets.push({fileName: icoOut, type: 'image/x-icon', source: await pngToIco(icoPngs)});
    return assets;
  }

  return {
    name: 'favicon-rasters',
    applyToEnvironment: (env) => env.name === 'client',
    // Dev: serve each icon on request so `vite dev` doesn't 404 them. Rasters are
    // built once on first hit and cached (sharp is expensive); editing the source
    // SVG needs a dev-server restart to re-rasterise.
    configureServer(server) {
      // Build the full set once on first request, then cache the promise.
      let cache: Promise<Map<string, IconAsset>> | undefined;
      for (const fileName of [svgOut, icoOut, ...pngs.map((p) => p.out)]) {
        server.middlewares.use(`/${fileName}`, (_req, res) => {
          cache ??= buildAssets().then((assets) => new Map(assets.map((a) => [a.fileName, a])));
          void cache
            .then((map) => {
              const asset = map.get(fileName);
              if (asset === undefined) {
                res.statusCode = 404;
                res.end();
                return;
              }
              res.setHeader('Content-Type', asset.type);
              res.end(asset.source);
            })
            .catch((err: unknown) => {
              server.config.logger.error(`[favicon-rasters] ${(err as Error).message}`);
              res.statusCode = 500;
              res.end();
            });
        });
      }
      server.config.logger.info(`✓ [favicon-rasters] Serving ${pngs.length + 2} dev icon routes`);
    },
    // Build: emit the same set to the client build root.
    async generateBundle() {
      for (const {fileName, source: assetSource} of await buildAssets()) {
        this.emitFile({type: 'asset', fileName, source: assetSource});
      }
    },
  };
}
