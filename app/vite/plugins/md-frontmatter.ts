import type {Highlighter} from 'shiki';
import type {Plugin} from 'vite';
import {readFile} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load} from 'js-yaml';
import {marked} from 'marked';
import markedFootnote from 'marked-footnote';
import {createHighlighter} from 'shiki';
import {isNonEmpty} from '../../lib/guards';
import {matter} from './frontmatter';

const SHIKI_LANGS = [
  'ts', 'tsx', 'js', 'jsx', 'json', 'yaml', 'md', 'markdown',
  'bash', 'shell', 'css', 'scss', 'html', 'ruby', 'python', 'text',
  'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'php', 'sql', 'dockerfile',
] as const;

const EXT_TO_LANG: Record<string, string> = {
  ts: 'ts', tsx: 'tsx', mts: 'ts', cts: 'ts',
  js: 'js', jsx: 'jsx', mjs: 'js', cjs: 'js',
  json: 'json', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  css: 'css', scss: 'scss', sass: 'scss',
  html: 'html', htm: 'html',
  rb: 'ruby', py: 'python',
  go: 'go', rs: 'rust',
  java: 'java', c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
  cs: 'csharp', php: 'php',
  sql: 'sql',
  dockerfile: 'dockerfile',
};

function langForFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower === 'dockerfile' || lower.endsWith('/dockerfile')) {
    return 'dockerfile';
  }
  const ext = lower.split('.').pop() ?? '';
  return EXT_TO_LANG[ext] ?? 'text';
}
const SHIKI_THEMES = {light: 'github-light-default', dark: 'github-dark-default'} as const;

// Shared regexes hoisted to module scope to avoid re-compilation on every call.
const HTMLESC_AMP_KEEPENT_RE = /&(?!#?\w+;)/g;
const HTMLESC_AMP_RE = /&/g;
const HTMLESC_LT_RE = /</g;
const HTMLESC_GT_RE = />/g;
const HTMLESC_DQUOT_RE = /"/g;
const HTMLESC_SQUOT_RE = /'/g;
const WHITESPACE_RE = /\s+/;
const TRAILING_NL_RE = /\n$/;
const PRE_CLASS_RE = /<pre([^>]*)class="([^"]*)"/;
const PRE_NO_CLASS_RE = /<pre(?![^>]*class=)/;
const BACKTICK_RE = /`/g;
const NON_WORD_SPACE_DASH_RE = /[^\w\s-]/g;
const SPACES_RE = /\s+/g;
const MULTI_DASH_RE = /-+/g;
const TRIM_DASH_RE = /^-|-$/g;
// ReDoS-safe heading matcher: capture the title without ambiguous leading/trailing whitespace overlap.
const HEADING_RE = /^(#{2,6})\s+(\S(?:[^\n]*\S)?)\s*$/;
const GIST_ID_SAFE_RE = /[^\w/-]/g;
// eslint-disable-next-line style/max-len -- regex literal cannot be wrapped
const IFRAME_GIST_RE = /<iframe\s+class="ta-gist"\s+src="https:\/\/gist\.github\.com\/(?:[^/"]+\/)?([a-f0-9]{6,})\.pibb"[^>]*><\/iframe>/gi;
const FENCED_CODE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;
// ReDoS-safe template token: explicitly require a non-} char before optional padding.
const TEMPLATE_TOKEN_RE = /\{\{\s*(\S(?:[^}]*\S)?)\s*\}\}/g;
const MASK_RESTORE_RE = /\0MASK(\d+)\0/g;
const TAG_RE = /<[^>]+>/g;
const HEADING_TAG_RE = /<(h[2-6])>([\s\S]*?)<\/\1>/g;
const ROUTE_FILE_EXT_RE = /\.(?:tsx?|jsx?)$/;
const TRAILING_SLASH_RE = /\/$/;
const SLASHES_RE = /\/+/g;
const TRAILING_SLASHES_RE = /\/+$/;
const CRLF_RE = /\r\n/g;

let highlighter: Highlighter | null = null;

function highlight(code: string, lang: string): string | null {
  if (!highlighter) {
    return null;
  }
  const loaded = highlighter.getLoadedLanguages();
  const resolved = loaded.includes(lang) ? lang : null;
  if (resolved == null) {
    return null;
  }
  return highlighter.codeToHtml(code, {
    lang: resolved,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });
}

marked.use(markedFootnote());

function htmlEscape(s: string, encode = false): string {
  return s
    .replace(encode ? HTMLESC_AMP_KEEPENT_RE : HTMLESC_AMP_RE, '&amp;')
    .replace(HTMLESC_LT_RE, '&lt;')
    .replace(HTMLESC_GT_RE, '&gt;')
    .replace(HTMLESC_DQUOT_RE, '&quot;')
    .replace(HTMLESC_SQUOT_RE, '&#39;');
}

// Support an opt-in `linenos` flag in fenced code-block info strings
// (e.g. ```js linenos). If a known language is present, shiki produces the
// highlighted HTML; otherwise we fall back to a plain escaped pre. The linenos
// flag injects a line-number gutter in either path.
marked.use({
  renderer: {
    code({text, lang}) {
      const tokens = (lang ?? '').trim().split(WHITESPACE_RE).filter(Boolean);
      const linenos = tokens.includes('linenos');
      const primaryLang = tokens.find((t) => t !== 'linenos') ?? '';
      const normalized = `${text.replace(TRAILING_NL_RE, '')}\n`;

      const shikiHtml = highlight(normalized, primaryLang);
      const base = shikiHtml
        ?? `<pre><code${primaryLang !== '' ? ` class="language-${htmlEscape(primaryLang)}"` : ''}>${htmlEscape(normalized, true)}</code></pre>`;

      if (!linenos) {
        return `${base}\n`;
      }
      const lineCount = normalized.replace(TRAILING_NL_RE, '').split('\n').length;
      const gutter = Array.from({length: lineCount}, (_, i) => String(i + 1)).join('\n');
      const gutterSpan = `<span aria-hidden="true" class="ta-linenos">${gutter}\n</span>`;
      // Inject the gutter span just before the <code> element inside <pre>, and
      // add the ta-linenos-block class so the grid layout kicks in.
      const withGutter = base
        .replace(PRE_CLASS_RE, `<pre$1class="$2 ta-linenos-block"`)
        .replace(PRE_NO_CLASS_RE, '<pre class="ta-linenos-block"')
        .replace('<code', `${gutterSpan}<code`);
      return `${withGutter}\n`;
    },
  },
});

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(BACKTICK_RE, '')
    .replace(NON_WORD_SPACE_DASH_RE, '')
    .replace(SPACES_RE, '-')
    .replace(MULTI_DASH_RE, '-')
    .replace(TRIM_DASH_RE, '');
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
    const m = HEADING_RE.exec(line);
    if (m) {
      const text = m[2]!.replace(BACKTICK_RE, '').trim();
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
    if (cur != null && typeof cur === 'object' && key in (cur as Record<string, unknown>)) {
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
  const safe = id.replace(GIST_ID_SAFE_RE, '');
  const src = `https://gist.github.com/${safe}.pibb`;
  return `<iframe class="ta-gist" src="${src}" loading="lazy" title="GitHub gist ${safe}"></iframe>`;
}

// Cross-origin iframes (gist.github.com) can't be measured from the parent —
// same-origin policy blocks reading their scrollHeight. Rather than ship a
// best-effort estimate, we fetch the gist's raw content at build time via the
// GitHub REST API and render each file ourselves (shiki for code, marked for
// markdown). The inline output matches the rest of the post's styling and has
// no sizing problem by construction. If the API fetch fails we leave the
// iframe placeholder in place as a graceful fallback.
const GIST_API_TIMEOUT_MS = 5000;
const PROSE_EXTS = new Set(['md', 'markdown', 'mdx', 'rst', 'txt']);
const gistEmbedCache = new Map<string, string | null>();

interface GistFile {
  filename?: string;
  content?: string;
}

async function fetchGist(id: string): Promise<Record<string, GistFile> | null> {
  let lastStatus = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GIST_API_TIMEOUT_MS);
    try {
      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(id)}`, {
        headers: {Accept: 'application/vnd.github+json', 'User-Agent': 'd3strukt0r-site-build'},
        signal: controller.signal,
      });
      if (!res.ok) {
        lastStatus = `HTTP ${res.status}`;
        if (res.status < 500 || attempt === 1) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      const data = (await res.json()) as {files?: Record<string, GistFile | null>};
      const out: Record<string, GistFile> = {};
      for (const [k, f] of Object.entries(data.files ?? {})) {
        if (f != null && isNonEmpty(f.content)) {
          out[k] = f;
        }
      }
      return out;
    } catch (e) {
      lastStatus = e instanceof Error ? e.message : String(e);
    } finally {
      clearTimeout(timeout);
    }
  }
  console.warn(`[md-frontmatter] gist fetch failed for ${id}: ${lastStatus} — iframe fallback will render`);
  return null;
}

function renderGistFile(filename: string, content: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  let body: string;
  if (PROSE_EXTS.has(ext)) {
    body = `<div class="ta-gist-prose">${String(marked.parse(content))}</div>`;
  } else {
    const lang = langForFilename(filename);
    const shikiHtml = highlight(content + (content.endsWith('\n') ? '' : '\n'), lang);
    body = shikiHtml ?? `<pre><code>${htmlEscape(content, true)}</code></pre>`;
  }
  const caption = `<figcaption class="ta-gist-filename">${htmlEscape(filename)}</figcaption>`;
  return `<figure class="ta-gist-file">${caption}${body}</figure>`;
}

async function renderGistEmbed(id: string): Promise<string | null> {
  if (gistEmbedCache.has(id)) {
    return gistEmbedCache.get(id) ?? null;
  }
  const files = await fetchGist(id);
  if (!files || Object.keys(files).length === 0) {
    gistEmbedCache.set(id, null);
    return null;
  }
  const parts = Object.entries(files).map(([key, f]) => renderGistFile(f.filename ?? key, f.content ?? ''));
  const gistHref = `https://gist.github.com/${id}`;
  const linkAttrs = `href="${gistHref}" target="_blank" rel="noopener noreferrer"`;
  const headerLink = `<a ${linkAttrs}>gist.github.com/${htmlEscape(id)}</a>`;
  const header = `<header class="ta-gist-head"><span aria-hidden="true">❖</span> ${headerLink}</header>`;
  const out = [
    `<div class="ta-gist-embed">`,
    header,
    parts.join(''),
    `</div>`,
  ].join('');
  gistEmbedCache.set(id, out);
  return out;
}

async function inlineGistEmbeds(html: string): Promise<string> {
  IFRAME_GIST_RE.lastIndex = 0;
  const matches = [...html.matchAll(IFRAME_GIST_RE)];
  const ids = [...new Set(matches.map((m) => m[1]!.toLowerCase()))];
  if (!ids.length) {
    return html;
  }
  const rendered = await Promise.all(ids.map(async (id) => [id, await renderGistEmbed(id)] as const));
  let out = html;
  for (const [id, embed] of rendered) {
    if (!isNonEmpty(embed)) {
      continue;
    }
    const prefix = `<iframe\\s+class="ta-gist"\\s+src="https:\\/\\/gist\\.github\\.com\\/(?:[^/"]+\\/)?`;
    const suffix = `\\.pibb"[^>]*><\\/iframe>`;
    const re = new RegExp(`${prefix}${id}${suffix}`, 'gi');
    out = out.replace(re, embed);
  }
  return out;
}

// Single `{{ token }}` grammar. Supported forms:
//   {{ toc }}               → bullet list of h2..h6 headings in this doc
//   {{ now }}               → current build date ("April 23, 2026")
//   {{ gist:USER/ID }}      → iframe pibb embed
//   {{ path.to.key }}       → dotted lookup against site.yml
//
// Fenced code blocks and inline code spans are masked before substitution so
// posts can document the syntax without the tokens being expanded in place.
export function expandTemplate(md: string, vars: Record<string, unknown>): string {
  const frozen: string[] = [];
  const mask = (m: string): string => {
    frozen.push(m);
    return `\x00MASK${frozen.length - 1}\x00`;
  };
  const masked = md
    .replace(FENCED_CODE_RE, mask)
    .replace(INLINE_CODE_RE, mask);

  const toc = buildTocList(masked);
  const expanded = masked.replace(TEMPLATE_TOKEN_RE, (match, rawInner: string) => {
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

  return expanded.replace(MASK_RESTORE_RE, (_m, idx: string) => frozen[Number(idx)]!);
}

// marked v15 doesn't emit id attributes on headings — inject them so the TOC
// anchors resolve.
function stripTags(s: string): string {
  let prev: string;
  let out = String(s);
  do {
    prev = out;
    out = out.replace(TAG_RE, '');
  } while (out !== prev);
  return out;
}

export function addHeadingIds(html: string): string {
  return html.replace(HEADING_TAG_RE, (_match, tag, inner) => {
    const text = stripTags(inner).trim();
    return `<${tag} id="${slugify(text)}">${inner}</${tag}>`;
  });
}

async function loadSiteVars(root: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(join(root, 'content', 'site.yml'), 'utf8');
    const parsed = load(raw);
    return (parsed != null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
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
  return isNonEmpty(file) ? basename(file).replace(ROUTE_FILE_EXT_RE, '') : '';
}

export function collectRouteUrls(nodes: RouteNode[]): Record<string, string> {
  const urls: Record<string, string> = {};
  const walk = (list: RouteNode[], prefix: string): void => {
    for (const n of list) {
      const segment = n.path ?? '';
      const full = segment.startsWith('/')
        ? segment
        : `${prefix.replace(TRAILING_SLASH_RE, '')}/${segment}`.replace(SLASHES_RE, '/');
      const normalized = full.replace(TRAILING_SLASHES_RE, '') || '/';
      const name = nameFromFile(n.file);
      if (n.index === true && name !== '') {
        urls[name] = prefix.replace(TRAILING_SLASH_RE, '') || '/';
      } else if (name !== '' && segment !== '*' && !segment.includes(':')) {
        urls[name] = normalized;
      }
      if (n.children != null) {
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
      await Promise.all([
        refreshVars(config.root),
        (async () => {
          if (!highlighter) {
            highlighter = await createHighlighter({
              themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
              langs: [...SHIKI_LANGS],
            });
          }
        })(),
      ]);
    },
    async load(id) {
      const [filepath, query] = id.split('?');
      if (filepath?.endsWith('.md') !== true || query !== 'parsed') {
        return null;
      }
      this.addWatchFile(filepath);
      if (siteYmlPath !== '') {
        this.addWatchFile(siteYmlPath);
      }
      if (routesPath !== '') {
        this.addWatchFile(routesPath);
      }
      const raw = (await readFile(filepath, 'utf8')).replace(CRLF_RE, '\n');
      const {data, content} = matter(raw);
      const expanded = expandTemplate(content, vars);
      const rendered = addHeadingIds(String(marked.parse(expanded)));
      const html = await inlineGistEmbeds(rendered);
      return `export default ${JSON.stringify({frontmatter: data, content: expanded, html})};`;
    },
  };
}
