import type {Config} from '@react-router/dev/config';
import process from 'node:process';

export default {
  // SSR by default. GitHub Pages has no Node runtime, so its workflow sets
  // BUILD_TARGET=pages to force SPA output (index.html + client bundle only).
  ssr: process.env.BUILD_TARGET !== 'pages',
} satisfies Config;
