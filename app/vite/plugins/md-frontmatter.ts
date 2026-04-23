import type {Plugin} from 'vite';
import {readFile} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import {marked} from 'marked';
import markedFootnote from 'marked-footnote';

marked.use(markedFootnote());

function htmlEscape(s: string, encode = false): string {
  return s
    .replace(encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Support an opt-in `linenos` flag in fenced code-block info strings
// (e.g. ```js linenos). Emits a two-column pre: gutter of line numbers + code.
marked.use({
  renderer: {
    code({text, lang, escaped}) {
      const tokens = (lang ?? '').trim().split(/\s+/).filter(Boolean);
      const linenos = tokens.includes('linenos');
      const primaryLang = tokens.find((t) => t !== 'linenos') ?? '';
      const normalized = text.replace(/\n$/, '') + '\n';
      const code = escaped ? normalized : htmlEscape(normalized, true);
      const cls = primaryLang ? ` class="language-${htmlEscape(primaryLang)}"` : '';
      if (!linenos) {
        return `<pre><code${cls}>${code}</code></pre>\n`;
      }
      const lineCount = normalized.replace(/\n$/, '').split('\n').length;
      const gutter = Array.from({length: lineCount}, (_, i) => String(i + 1)).join('\n');
      return `<pre class="ta-linenos-block"><span aria-hidden="true" class="ta-linenos">${gutter}\n</span><code${cls}>${code}</code></pre>\n`;
    },
  },
});

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/`/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractHeadings(md: string): Array<{level: number; text: string; slug: string}> {
  const out: Array<{level: number; text: string; slug: string}> = [];
  let inCode = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      continue;
    }
    const m = /^(#{2,6})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const text = m[2]!.replace(/`/g, '').trim();
      out.push({level: m[1]!.length, text, slug: slugify(text)});
    }
  }
  return out;
}

function buildTocList(md: string): string {
  const headings = extractHeadings(md);
  if (headings.length === 0) {
    return '';
  }
  return headings.map((h) => `${'  '.repeat(h.level - 2)}- [${h.text}](#${h.slug})`).join('\n');
}

function lookup(path: string, vars: Record<string, unknown>): string | undefined {
  const parts = path.trim().split('.');
  let cur: unknown = vars;
  for (const key of parts) {
    if (cur && typeof cur === 'object' && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' || typeof cur === 'number' || typeof cur === 'boolean' ? String(cur) : undefined;
}

function formatNow(): string {
  return new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
}

function gistEmbed(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9/_-]/g, '');
  return `<iframe class="ta-gist" src="https://gist.github.com/${safe}.pibb" loading="lazy" title="GitHub gist ${safe}"></iframe>`;
}

// Single `{{ token }}` grammar. Supported forms:
//   {{ toc }}               → bullet list of h2..h6 headings in this doc
//   {{ now }}               → current build date ("April 23, 2026")
//   {{ gist:USER/ID }}      → iframe pibb embed
//   {{ path.to.key }}       → dotted lookup against site.yml
export function expandTemplate(md: string, vars: Record<string, unknown>): string {
  const toc = buildTocList(md);
  return md.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawInner: string) => {
    const inner = rawInner.trim();
    if (inner === 'toc') {
      return toc;
    }
    if (inner === 'now') {
      return formatNow();
    }
    if (inner.startsWith('gist:')) {
      return gistEmbed(inner.slice('gist:'.length).trim());
    }
    const resolved = lookup(inner, vars);
    return resolved ?? match;
  });
}

// marked v15 doesn't emit id attributes on headings — inject them so the TOC
// anchors resolve.
export function addHeadingIds(html: string): string {
  return html.replace(/<(h[2-6])>([\s\S]*?)<\/\1>/g, (_match, tag, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, '').trim();
    return `<${tag} id="${slugify(text)}">${inner}</${tag}>`;
  });
}

async function loadSiteVars(root: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(join(root, 'content', 'site.yml'), 'utf8');
    const parsed = yaml.load(raw);
    return (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Minimal shape of the nodes `@react-router/dev/routes`' `index()`/`route()`/
// `layout()` helpers produce. We import `app/routes.ts` at plugin startup to
// derive a `{name: path}` map so posts can link routes via
// `{{ urls.<route-file-basename> }}` without duplicating paths elsewhere.
interface RouteNode {
  file?: string;
  path?: string;
  index?: boolean;
  children?: RouteNode[];
}

function nameFromFile(file: string | undefined): string {
  return file ? basename(file).replace(/\.(tsx?|jsx?)$/, '') : '';
}

export function collectRouteUrls(nodes: RouteNode[]): Record<string, string> {
  const urls: Record<string, string> = {};
  const walk = (list: RouteNode[], prefix: string): void => {
    for (const n of list) {
      const segment = n.path ?? '';
      const full = segment.startsWith('/')
        ? segment
        : `${prefix.replace(/\/$/, '')}/${segment}`.replace(/\/+/g, '/');
      const normalized = full.replace(/\/+$/, '') || '/';
      const name = nameFromFile(n.file);
      if (n.index && name) {
        urls[name] = prefix.replace(/\/$/, '') || '/';
      } else if (name && segment !== '*' && !segment.includes(':')) {
        urls[name] = normalized;
      }
      if (n.children) {
        walk(n.children, normalized);
      }
    }
  };
  walk(nodes, '');
  return urls;
}

// Node 24 strips TypeScript types natively (unflagged since Node 22.18), so we
// can dynamic-import `app/routes.ts` directly — no bundler step, no temp file.
async function loadRouterUrls(root: string): Promise<Record<string, string>> {
  try {
    const mod = await import(pathToFileURL(join(root, 'app', 'routes.ts')).href);
    const nodes = (mod.default ?? mod) as RouteNode[];
    return collectRouteUrls(nodes);
  } catch {
    return {};
  }
}

// Parse *.md?parsed imports at build time so gray-matter/marked/js-yaml never
// land in the client bundle.
export function mdFrontmatter(): Plugin {
  let vars: Record<string, unknown> = {};
  let siteYmlPath = '';
  let routesPath = '';
  async function refreshVars(root: string): Promise<void> {
    const [siteVars, routerUrls] = await Promise.all([loadSiteVars(root), loadRouterUrls(root)]);
    const siteUrls = (siteVars.urls && typeof siteVars.urls === 'object' ? siteVars.urls : {}) as Record<string, string>;
    vars = {...siteVars, urls: {...routerUrls, ...siteUrls}};
  }
  return {
    name: 'md-frontmatter',
    enforce: 'pre',
    async configResolved(config) {
      siteYmlPath = join(config.root, 'content', 'site.yml');
      routesPath = join(config.root, 'app', 'routes.ts');
      await refreshVars(config.root);
    },
    async load(id) {
      const [filepath, query] = id.split('?');
      if (!filepath?.endsWith('.md') || query !== 'parsed') {
        return null;
      }
      this.addWatchFile(filepath);
      if (siteYmlPath) {
        this.addWatchFile(siteYmlPath);
      }
      if (routesPath) {
        this.addWatchFile(routesPath);
      }
      const raw = (await readFile(filepath, 'utf8')).replace(/\r\n/g, '\n');
      const {data, content} = matter(raw);
      const expanded = expandTemplate(content, vars);
      const html = addHeadingIds(String(marked.parse(expanded)));
      return `export default ${JSON.stringify({frontmatter: data, content: expanded, html})};`;
    },
  };
}
