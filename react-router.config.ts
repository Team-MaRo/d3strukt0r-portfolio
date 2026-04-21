import type {Config} from '@react-router/dev/config';

export default {
  // SPA mode — no server rendering. Client rehydrates a browser router;
  // a postbuild step (scripts/generate-static.mjs) copies index.html →
  // 404.html so GitHub Pages falls back to the SPA on unknown paths.
  ssr: false,
} satisfies Config;
