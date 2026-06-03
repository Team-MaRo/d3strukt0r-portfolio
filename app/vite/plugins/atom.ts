import type {Plugin} from 'vite';
import {Feed} from 'feed';
import {postPath} from '../../lib/site-url';

export interface FeedPost {
  title: string;
  date: string;
  html: string;
  slug: string;
}

// Pure renderer — shared with the SSR `atom.xml` resource route.
export function renderAtom(
  siteUrl: string,
  posts: readonly FeedPost[],
  author: {name: string; email: string},
  now: Date,
): string {
  const feed = new Feed({
    title: author.name,
    id: `${siteUrl}/`,
    link: `${siteUrl}/`,
    updated: now,
    copyright: `© ${now.getFullYear()} ${author.name}`,
    feedLinks: {atom: `${siteUrl}/atom.xml`},
    author,
  });
  for (const p of posts.slice(0, 20)) {
    const url = `${siteUrl}${postPath(p)}`;
    feed.addItem({
      title: p.title,
      id: url,
      link: url,
      date: p.date !== '' ? new Date(p.date) : now,
      content: p.html,
    });
  }
  return feed.atom1();
}

interface Options {
  siteUrl: string;
  posts: readonly FeedPost[];
  author: {name: string; email: string};
}

// Build plugin: emits the static `atom.xml` for the SPA build from the
// caller-supplied posts (loaded in `vite.config.ts`). SPA + client env only;
// the SSR image serves the route instead.
export function atom(opts: Options): Plugin {
  return {
    name: 'atom',
    apply: 'build',
    applyToEnvironment: (env) => env.name === 'client',
    generateBundle() {
      const source = renderAtom(opts.siteUrl, opts.posts, opts.author, new Date());
      this.emitFile({type: 'asset', fileName: 'atom.xml', source});
    },
  };
}
