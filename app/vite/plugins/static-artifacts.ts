import type {Plugin} from 'vite';
import {copyFileSync, existsSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadPosts} from './posts';

const XML_ESC_RE = /[&<>"']/g;
const DATE_DASH_RE = /-/g;

interface Options {
  outDir: string;
  postsDir: string;
  siteUrl: string;
  author: {name: string; email: string};
}

// Emits SPA-fallback + Atom feed into the build output. Sitemap + robots are
// handled by vite-plugin-sitemap / vite-plugin-robots-ts.
export function staticArtifacts(opts: Options): Plugin {
  return {
    name: 'static-artifacts',
    apply: 'build',
    closeBundle() {
      const {outDir, postsDir, siteUrl, author} = opts;
      if (!existsSync(outDir)) {
        return;
      }

      const indexHtml = join(outDir, 'index.html');
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, join(outDir, '404.html'));
      }

      const posts = loadPosts(postsDir);
      const now = new Date().toISOString();
      const xmlEscape = (s: string) => s.replace(XML_ESC_RE, (c) => (
        {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&apos;'}[c]!
      ));

      const entries = posts.slice(0, 20).map((p) => {
        const path = `/${p.date.slice(0, 10).replace(DATE_DASH_RE, '/')}/${p.slug}`;
        return (
          `  <entry>\n`
          + `    <title>${xmlEscape(p.title)}</title>\n`
          + `    <link href="${siteUrl}${path}"/>\n`
          + `    <updated>${p.date !== '' ? p.date : now}</updated>\n`
          + `    <id>${siteUrl}${path}</id>\n`
          + `    <content type="html">${xmlEscape(p.html)}</content>\n`
          + `  </entry>`
        );
      }).join('\n');

      writeFileSync(
        join(outDir, 'atom.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n`
        + `<feed xmlns="http://www.w3.org/2005/Atom">\n`
        + `  <title>${xmlEscape(author.name)}</title>\n`
        + `  <link href="${siteUrl}/atom.xml" rel="self"/>\n`
        + `  <link href="${siteUrl}/"/>\n`
        + `  <updated>${now}</updated>\n`
        + `  <id>${siteUrl}/</id>\n`
        + `  <author><name>${xmlEscape(author.name)}</name><email>${xmlEscape(author.email)}</email></author>\n`
        + `${entries}\n`
        + `</feed>\n`,
      );
    },
  };
}
