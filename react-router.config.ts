import type {Config} from '@react-router/dev/config';
import process from 'node:process';

// Router basename, derived from BASE_PATH (set by deploy-gh-pages.yml) and
// normalised to EXACTLY match Vite's `base`: '/' for the root-served
// Cloudflare/Docker builds, '/<repo>/' for the GitHub Pages sub-path build.
// React Router requires `basename` to begin with Vite's `base`, and Vite's
// `base` always carries a trailing slash — so keep one here too.
const trimmedBase = (process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');
const BASENAME = trimmedBase === '' ? '/' : `/${trimmedBase}/`;

export default {
  // SSR by default. GitHub Pages has no Node runtime, so its workflow sets
  // SSR=false to force SPA output (index.html + client bundle only).
  ssr: process.env.SSR !== 'false',
  // Router basename. Matches Vite's `base` (set from BASE_PATH): `/` for the
  // root-served Cloudflare/Docker builds, `/<repo>` for the GitHub Pages
  // sub-path build (custom domain disabled → project site at /<repo>/). RR
  // wants no trailing slash; Vite `base` keeps it.
  basename: BASENAME,
} satisfies Config;
