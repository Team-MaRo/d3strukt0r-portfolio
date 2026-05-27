import type {Plugin} from 'vite';
import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import {formatHex} from 'culori';
import pngToIco from 'png-to-ico';
import {WEB_MANIFEST_ICONS} from '../../config/web-manifest';

interface Options {
  // Path (relative to project root) of the source SVG. The committed file
  // ships both light + dark variants via a `prefers-color-scheme` <style>
  // block; raster fallbacks here are always the SVG's light-mode rendering.
  source?: string;
  // Output filename for the SVG copy emitted to the build root. Browser
  // tab `<link rel="icon">` references this. Defaults to `favicon.svg`.
  svgOut?: string;
}

// Default source path — lives under `app/assets/` so the entire `public/`
// directory can stay deleted (build emits all favicon artifacts).

// PNGs not declared by the manifest — favicon-sized + Apple touch icon.
// Anything the manifest also wants generated lives there; this list covers
// only the rasters referenced via `<link rel>` in `root.tsx`.
const PNG_SIZES = [
  {size: 96, out: 'favicon-96x96.png'},
  {size: 180, out: 'apple-touch-icon.png'},
] as const;

// Resolutions baked into the multi-image .ico. Matches what RealFavicon-
// Generator embeds: 16/32/48
// at 32bpp, BMP-encoded inside the ICO container for maximum legacy support.
const ICO_SIZES = [16, 32, 48] as const;

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
// `<link rel="icon">` URL keeps working without keeping duplicate copies
// in `public/`. PNG outputs come from a mix of:
//   1. `WEB_MANIFEST_ICONS` (shared with the `web-manifest` plugin so the
//      PWA install icons and the rasters stay in lockstep),
//   2. `PNG_SIZES` for non-manifest entries (favicon-96, apple-touch-icon),
//   3. `ICO_SIZES` for the multi-resolution `.ico`.
// All emitted via `emitFile` so they land at the expected root URLs in
// `build/client/` without going through `public/`.
//
// Runs in the client build only — SSR doesn't need favicons.
export function faviconRasters(opts: Options = {}): Plugin {
  const source = opts.source ?? join('app', 'assets', 'favicon.svg');
  const svgOut = opts.svgOut ?? 'favicon.svg';

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

      const allPngs = [...PNG_SIZES, ...WEB_MANIFEST_ICONS.map((i) => ({size: i.size, out: i.out}))];
      for (const {size, out} of allPngs) {
        const buf = await renderPng(size);
        this.emitFile({type: 'asset', fileName: out, source: buf});
      }

      // Multi-resolution favicon.ico — `png-to-ico` takes PNG buffers and
      // produces BMP-encoded (DIB) entries inside the ICO, matching the
      // format that RealFaviconGenerator emits for maximum browser/OS
      // compatibility (pre-Vista Windows + older shells can't read
      // PNG-in-ICO).
      const icoPngs = await Promise.all(ICO_SIZES.map(async (s) => renderPng(s)));
      const ico = await pngToIco(icoPngs);
      this.emitFile({type: 'asset', fileName: 'favicon.ico', source: ico});
    },
  };
}
