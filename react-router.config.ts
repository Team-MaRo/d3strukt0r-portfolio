import type {Config} from '@react-router/dev/config';
import process from 'node:process';

export default {
  // SSR by default. GitHub Pages has no Node runtime, so its workflow sets
  // SSR=false to force SPA output (index.html + client bundle only).
  ssr: process.env.SSR !== 'false',
  // Opt into the React Router v8 behaviours early (silences the build-log
  // future-flag warnings and de-risks the eventual v8 bump).
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
