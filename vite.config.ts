import {join} from 'node:path';
import process from 'node:process';
import {cloudflare} from '@cloudflare/vite-plugin';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import {defineConfig} from 'vitest/config';
import {postPath} from './app/lib/site-url';
import {atom} from './app/vite/plugins/atom';
import {copyrightFromLicense} from './app/vite/plugins/copyright-from-license';
import {faviconRasters} from './app/vite/plugins/favicon-rasters';
import {mdFrontmatter} from './app/vite/plugins/md-frontmatter';
import {loadPosts} from './app/vite/plugins/posts';
import {robots} from './app/vite/plugins/robots';
import {seal} from './app/vite/plugins/seal';
import {sitemap} from './app/vite/plugins/sitemap';
import {spaFallback} from './app/vite/plugins/spa-fallback';
import {webManifest} from './app/vite/plugins/web-manifest';
import {yaml} from './app/vite/plugins/yaml';

const WEB_MANIFEST_ICONS = [
  {size: 192, out: 'web-app-manifest-192x192.png', purpose: 'maskable'},
  {size: 512, out: 'web-app-manifest-512x512.png', purpose: 'maskable'},
] as const;

const isVitest = process.env.VITEST === 'true';
// Cloudflare Workers SSR target. Opt in with CLOUDFLARE=true (the build:cf /
// dev:cf scripts set it; Cloudflare Workers Builds runs build:cf). Coexists
// with the default Node/Nix SSR build and the SSR=false GitHub Pages SPA build
// — neither sets CLOUDFLARE, so the plugin stays out of their pipeline.
const isCloudflare = process.env.CLOUDFLARE === 'true';
// SSR serves the SEO artifacts as runtime resource routes; only the SPA
// (GitHub Pages) build emits them as static files (host known at build time).
const isSpa = process.env.SSR === 'false';

// Deployed hostname for the SPA build's static SEO files. CI's
// deploy-gh-pages.yml derives SITE_HOST from the Pages API — the custom domain
// when set, else the github.io host (paired with BASE_PATH below for the
// project sub-path). Local dev falls back to localhost. The SSR image ignores
// this and resolves the host per request (app/lib/site-url.ts).
const trimmedHost = process.env.SITE_HOST?.trim();
const SITE_HOST = trimmedHost === undefined || trimmedHost === '' ? 'localhost' : trimmedHost;
// Deployment base path. deploy-gh-pages.yml sets BASE_PATH from the Pages URL:
// `/` for a custom domain (root), `/<repo>/` for a project sub-path. Unset for
// the Cloudflare/Docker SSR builds → root. Normalised to a single
// leading+trailing slash so Vite `base`, the SEO URLs and the manifest agree.
const rawBase = process.env.BASE_PATH?.trim();
const BASE_PATH = rawBase === undefined || rawBase === '' || rawBase === '/'
  ? '/'
  : `/${rawBase.replace(/^\/+|\/+$/g, '')}/`;
const BASE_NO_SLASH = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, ''); // '' or '/<repo>'
const ORIGIN = `https://${SITE_HOST}`;
// Canonical URL incl. sub-path — for robots.txt + atom (they concatenate it).
const SITE_URL = `${ORIGIN}${BASE_NO_SLASH}`;
const POSTS_DIR = join(process.cwd(), 'content', 'posts');
// Loaded once for the SPA build's sitemap paths + atom feed (the SSR routes
// derive these from the runtime post list instead).
const blogPosts = isSpa ? loadPosts(POSTS_DIR) : [];
// Sitemap is fed origin + sub-path-prefixed paths (its SitemapStream resolves a
// root-absolute path against the origin and would drop the sub-path otherwise).
const sitemapPaths = ['/', '/cv', '/blog', ...blogPosts.map(postPath)].map((p) => `${BASE_NO_SLASH}${p}`);

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    // Cloudflare Workers environment plugin. Must run first so it can register
    // the `ssr` Vite environment before reactRouter() wires its server build
    // into it. Gated on CLOUDFLARE=true, never active under Vitest (it clashes with
    // the test environment, same as reactRouter()).
    ...(isCloudflare && !isVitest
      ? [
          cloudflare({viteEnvironment: {name: 'ssr'}}),
        ]
      : []),
    seal({
      rootDir: process.cwd(),
      contentDir: join(process.cwd(), 'content', 'linkedin'),
      sensitiveFile: join(process.cwd(), 'content', 'linkedin', 'sensitive.yml'),
    }),
    tailwindcss(),
    // Pulls year(s) + holder from LICENSE.txt and exposes them as
    // build-time globals (__COPYRIGHT_YEARS__, __COPYRIGHT_HOLDER__) so
    // the footer copyright stays in lockstep with the legal artefact.
    copyrightFromLicense(),
    // Rasterises `app/assets/favicon.svg` to PNG + multi-resolution ICO
    // during the client build. Modern browsers use the SVG directly; these
    // are fallbacks for older platforms. The PNG set merges the favicon-only
    // sizes with the shared PWA manifest icons so the rasters and the
    // manifest stay in lockstep.
    faviconRasters({
      source: join('app', 'assets', 'favicon.svg'),
      svgOut: 'favicon.svg',
      icoOut: 'favicon.ico',
      pngs: [
        {size: 96, out: 'favicon-96x96.png'},
        {size: 180, out: 'apple-touch-icon.png'},
        ...WEB_MANIFEST_ICONS.map((i) => ({size: i.size, out: i.out})),
      ],
      icoSizes: [16, 32, 48],
    }),
    // Emits `site.webmanifest` at build time. Shares its icon set with
    // `faviconRasters`; sources the text fields from the locale YAML's
    // `brand.*` so a single edit in `de.yml` propagates to the PWA listing.
    webManifest({
      base: BASE_PATH,
      locale: join('app', 'locales', 'de.yml'),
      out: 'site.webmanifest',
      keys: {name: 'brand.name', short_name: 'brand.short_name', description: 'brand.description'},
      // Static knobs; colours are the sRGB-hex rendering of the dark
      // `--background` token (oklch(16.08% 0.0103 285.19deg) → #0d0d12; theme
      // defaults dark). Stays hex because Android launchers don't parse oklch().
      manifest: {display: 'standalone', theme_color: '#0d0d12', background_color: '#0d0d12'},
      icons: WEB_MANIFEST_ICONS,
    }),
    // react-router's vite plugin clashes with vitest's environment setup, so
    // skip it when running tests.
    ...(isVitest ? [] : [reactRouter()]),
    mdFrontmatter(),
    yaml(),
    svgr({include: '**/*.svg?react'}),
    // sitemap.xml / robots.txt / atom.xml as static files — SPA build only, each
    // via its own plugin's render fn (the SSR image serves the same through
    // resource routes, resolving the host per request).
    ...(isSpa
      ? [
          sitemap({siteUrl: ORIGIN, paths: sitemapPaths}),
          robots({siteUrl: SITE_URL}),
          atom({siteUrl: SITE_URL, posts: blogPosts, author: {name: 'Manuele', email: 'gh-contact@d3st.dev'}}),
        ]
      : []),
    // Reads build/client from the resolved Vite config (no outDir passed).
    // react-router writes build/client/index.html during the SSR build pass,
    // after the client env's closeBundle; running on both envs lets the copy
    // succeed on the SSR pass.
    spaFallback(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
  },
});
