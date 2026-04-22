import type {Plugin} from 'vite';
import {readFile} from 'node:fs/promises';
import matter from 'gray-matter';
import {marked} from 'marked';

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

// Expand Kramdown / Liquid leftovers that Jekyll handled but marked doesn't:
//   - `- toc\n{: toc }` → bullet list of the document's h2..h6 headings
//   - any other `{: ... }` IAL block on its own line → stripped
//   - `{{ ... }}` / `{% ... %}` Liquid directives → stripped, so they never
//     leak to the rendered page as literal text.
export function expandKramdown(md: string): string {
  const headings = extractHeadings(md);
  const toc = headings.length > 0
    ? headings.map((h) => `${'  '.repeat(h.level - 2)}- [${h.text}](#${h.slug})`).join('\n')
    : '';
  let out = md.replace(/^[-*][ \t]+toc[ \t]*\r?\n\{:[ \t]*toc[ \t]*\}[ \t]*$/gm, toc);
  out = out.replace(/^\{:[^}]*\}[ \t]*$/gm, '');
  out = out.replace(/\{\{[^}]*\}\}/g, '');
  out = out.replace(/\{%[^%]*%\}/g, '');
  return out;
}

// marked v15 doesn't emit id attributes on headings — inject them so the TOC
// anchors resolve.
export function addHeadingIds(html: string): string {
  return html.replace(/<(h[2-6])>([\s\S]*?)<\/\1>/g, (_match, tag, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, '').trim();
    return `<${tag} id="${slugify(text)}">${inner}</${tag}>`;
  });
}

// Parse *.md?parsed imports at build time so gray-matter/marked/js-yaml never
// land in the client bundle.
export function mdFrontmatter(): Plugin {
  return {
    name: 'md-frontmatter',
    enforce: 'pre',
    async load(id) {
      const [filepath, query] = id.split('?');
      if (!filepath?.endsWith('.md') || query !== 'parsed') {
        return null;
      }
      this.addWatchFile(filepath);
      const raw = await readFile(filepath, 'utf8');
      const {data, content} = matter(raw);
      const expanded = expandKramdown(content);
      const html = addHeadingIds(String(marked.parse(expanded)));
      return `export default ${JSON.stringify({frontmatter: data, content, html})};`;
    },
  };
}
