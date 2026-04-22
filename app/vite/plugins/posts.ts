import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import matter from 'gray-matter';
import {marked} from 'marked';

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
      const slug = f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
      const dateSrc = data.date ?? f.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
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
