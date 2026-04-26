export interface Post {
  slug: string;
  title: string;
  date: string;
  html: string;
  excerpt: string;
  readTime: number;
}

interface ParsedMd {
  frontmatter: {
    title?: string;
    date?: string | Date;
    [k: string]: unknown;
  };
  content: string;
  html: string;
}

const postFiles = import.meta.glob<ParsedMd>('../../content/posts/*.md', {
  query: '?parsed',
  import: 'default',
  eager: true,
});

function pathSlug(p: string): string {
  const base = p.split('/').pop()!.replace(/\.md$/, '');
  // Strip leading YYYY-MM-DD- for posts.
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function parseDate(raw: unknown): string {
  if (!raw) {
    return '';
  }
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) {
    return String(raw);
  }
  return d.toISOString().slice(0, 10);
}

export const posts: Post[] = Object.entries(postFiles)
  .map(([path, mod]) => {
    const {frontmatter, content, html} = mod;
    const plain = content.replace(/[#>*_`]/g, '').trim();
    const wordCount = plain ? plain.split(/\s+/).length : 0;
    return {
      slug: pathSlug(path),
      title: String(frontmatter.title ?? pathSlug(path)),
      date: parseDate(frontmatter.date ?? path.match(/\d{4}-\d{2}-\d{2}/)?.[0]),
      html,
      excerpt: plain.split('\n').find(Boolean)?.slice(0, 160) ?? '',
      readTime: Math.max(1, Math.round(wordCount / 200)),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function postBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function postUrl(post: Pick<Post, 'date' | 'slug'>): string {
  return `/${post.date.slice(0, 10).replace(/-/g, '/')}/${post.slug}`;
}
