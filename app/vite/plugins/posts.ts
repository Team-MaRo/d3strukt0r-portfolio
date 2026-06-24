import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {marked} from 'marked';
import {matter} from './frontmatter';

const MD_EXT_RE = /\.md$/;
const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}-/;
const DATE_RE = /\d{4}-\d{2}-\d{2}/;

export interface LoadedPost {
  slug: string;
  title: string;
  date: string;
  html: string;
}

export function loadPosts(dir: string): LoadedPost[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const {data, content} = matter(raw);
      const slug = f.replace(MD_EXT_RE, '').replace(DATE_PREFIX_RE, '');
      const dateSrc = String(data.date ?? f.match(DATE_RE)?.[0] ?? '');
      const d = new Date(dateSrc);
      const date = Number.isNaN(d.getTime()) ? String(dateSrc) : d.toISOString();
      return {
        slug,
        title: String(data.title ?? slug),
        date,
        html: String(marked.parse(content)),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
