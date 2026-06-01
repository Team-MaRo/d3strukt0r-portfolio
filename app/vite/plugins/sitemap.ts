import type {Plugin} from 'vite';
import {Readable} from 'node:stream';
import {SitemapStream, streamToPromise} from 'sitemap';

// Pure renderer — shared with the SSR `sitemap.xml` resource route.
export async function renderSitemap(siteUrl: string, paths: readonly string[]): Promise<string> {
  const stream = new SitemapStream({hostname: siteUrl});
  const data = await streamToPromise(Readable.from(paths.map((url) => ({url}))).pipe(stream));
  return data.toString();
}

interface Options {
  siteUrl: string;
  paths: readonly string[];
}

// Build plugin: emits the static `sitemap.xml` for the SPA build from the
// caller-supplied paths (built in `vite.config.ts`). SPA + client env only; the
// SSR image serves the route instead, building its paths from the runtime post
// list.
export function sitemap(opts: Options): Plugin {
  return {
    name: 'sitemap',
    apply: 'build',
    applyToEnvironment: (env) => env.name === 'client',
    async generateBundle() {
      this.emitFile({type: 'asset', fileName: 'sitemap.xml', source: await renderSitemap(opts.siteUrl, opts.paths)});
    },
  };
}
