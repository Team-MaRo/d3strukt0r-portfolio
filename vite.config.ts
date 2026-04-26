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
import {mdFrontmatter} from './app/vite/plugins/md-frontmatter';
import {loadPosts} from './app/vite/plugins/posts';
import {staticArtifacts} from './app/vite/plugins/static-artifacts';

const SITE_URL = 'https://d3strukt0r.dev';
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
    staticArtifacts({
      outDir: absOutDir,
      postsDir: POSTS_DIR,
      siteUrl: SITE_URL,
      author: {name: 'Manuele', email: 'gh-contact@d3st.dev'},
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
