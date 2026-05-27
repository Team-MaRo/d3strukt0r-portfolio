import type {Plugin} from 'vite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';
import {ALLOW_ALL, robots} from 'vite-plugin-robots-ts';
import sitemap from 'vite-plugin-sitemap';
import {atomFeed} from './app/vite/plugins/atom-feed';
import {faviconRasters} from './app/vite/plugins/favicon-rasters';
import {mdFrontmatter} from './app/vite/plugins/md-frontmatter';
import {loadPosts} from './app/vite/plugins/posts';
import {seal} from './app/vite/plugins/seal';
import {spaFallback} from './app/vite/plugins/spa-fallback';
import {webManifest} from './app/vite/plugins/web-manifest';

// Resolved at workflow time from the GitHub Pages REST API: deploy-gh-pages.yml
// fetches `gh api repos/<repo>/pages --jq .cname` and exports SITE_HOST.
// Local dev and the CI smoke build (no Pages secret) fall back to localhost so
// the sitemap + atom self-links still produce a parseable URL.
const trimmedHost = process.env.SITE_HOST?.trim();
const SITE_HOST = trimmedHost === undefined || trimmedHost === '' ? 'localhost' : trimmedHost;
const SITE_URL = `https://${SITE_HOST}`;
const OUT_DIR = 'build/client';
const POSTS_DIR = join(process.cwd(), 'content', 'posts');
const DATE_DASH_RE = /-/g;

const blogRoutes = loadPosts(POSTS_DIR).map(
  (p) => `/${p.date.slice(0, 10).replace(DATE_DASH_RE, '/')}/${p.slug}`,
);
const absOutDir = join(process.cwd(), OUT_DIR);

// react-router v7 runs Vite with multiple environments (client, SSR). Scope
// sitemap + robots to the client build so their `closeBundle` hooks don't fire
// for the SSR output (which lives at `build/server/`).
function clientOnly(plugin: Plugin): Plugin {
  return {...plugin, applyToEnvironment: (env) => env.name === 'client'};
}

// Ensure the client outDir exists before sitemap/robots try to write into it.
// Their `closeBundle` hooks run before react-router has flushed assets to disk
// on a cold build.
mkdirSync(absOutDir, {recursive: true});

export default defineConfig({
  plugins: [
    seal({
      rootDir: process.cwd(),
      contentDir: join(process.cwd(), 'content', 'linkedin'),
      sensitiveFile: join(process.cwd(), 'content', 'linkedin', 'sensitive.yml'),
    }),
    tailwindcss(),
    reactRouter(),
    mdFrontmatter(),
    ViteYaml(),
    clientOnly(sitemap({
      hostname: SITE_URL,
      outDir: OUT_DIR,
      dynamicRoutes: ['/', '/cv', '/blog', ...blogRoutes],
      generateRobotsTxt: false,
    })),
    clientOnly(robots({
      content: `${ALLOW_ALL}\n`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    })),
    spaFallback({outDir: absOutDir}),
    atomFeed({
      outDir: absOutDir,
      postsDir: POSTS_DIR,
      siteUrl: SITE_URL,
      author: {name: 'Manuele', email: 'gh-contact@d3st.dev'},
    }),
    faviconRasters(),
    webManifest(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
