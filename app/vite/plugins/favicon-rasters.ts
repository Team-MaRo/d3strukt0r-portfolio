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

// Generates PNG + ICO favicon fallbacks from the source SVG during the
// client build, plus emits the SVG itself to the build root so the
// `<link rel="icon">` URL keeps working without keeping a duplicate copy
// in `public/`.
//
// PNG outputs (`opts.pngs`) and ICO resolutions (`opts.icoSizes`) are
// supplied by the caller in `vite.config.ts`, which merges the favicon-only
// sizes with the shared PWA manifest icons so the rasters and the manifest
// stay in lockstep without this plugin importing a config module. All
// emitted via `emitFile` so they land at the expected root URLs in
// `build/client/` without going through `public/`.
//
// Runs in the client build only — SSR doesn't need favicons.
export function faviconRasters(opts: Options): Plugin {
  const {source, svgOut, icoOut, pngs, icoSizes} = opts;

  return {
    name: 'favicon-rasters',
    applyToEnvironment: (env) => env.name === 'client',
    apply: 'build',
    async generateBundle() {
      const sharp = (await import('sharp')).default;
      const svg = readFileSync(join(process.cwd(), source));

      // Copy the source SVG to the build root so /favicon.svg keeps working
      // for `<link rel="icon">` tags.
      this.emitFile({type: 'asset', fileName: svgOut, source: svg});

      // Raster pipeline gets a transformed SVG with class-based fills/strokes
      // inlined onto each element (libvips ignores `<style>` rules).
      const svgForRaster = Buffer.from(inlineLightModeStyles(svg.toString('utf8')), 'utf8');

      // Density 384 gives sharp enough headroom to rasterise the SVG up to
      // 512px without aliasing.
      const renderPng = async (size: number) => sharp(svgForRaster, {density: 384})
        .resize(size, size, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
        .png()
        .toBuffer();

      for (const {size, out} of pngs) {
        const buf = await renderPng(size);
        this.emitFile({type: 'asset', fileName: out, source: buf});
      }

      // Multi-resolution favicon.ico — `png-to-ico` takes PNG buffers and
      // produces BMP-encoded (DIB) entries inside the ICO, matching the
      // format that RealFaviconGenerator emits for maximum browser/OS
      // compatibility (pre-Vista Windows + older shells can't read
      // PNG-in-ICO).
      const icoPngs = await Promise.all(icoSizes.map(async (s) => renderPng(s)));
      const ico = await pngToIco(icoPngs);
      this.emitFile({type: 'asset', fileName: icoOut, source: ico});
    },
  };
}
