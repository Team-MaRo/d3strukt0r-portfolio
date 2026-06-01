import type {Plugin} from 'vite';
import {RobotsTxt} from 'robotstxt-util';

// Pure renderer — shared with the SSR `robots.txt` resource route.
export function renderRobots(siteUrl: string): string {
  const robots = new RobotsTxt();
  robots.newGroup('*').allow('/');
  robots.add('sitemap', `${siteUrl}/sitemap.xml`);
  return robots.txt();
}

interface Options {
  siteUrl: string;
}

// Build plugin: emits the static `robots.txt` for the SPA build. SPA + client
// env only; the SSR image serves the route instead.
export function robots(opts: Options): Plugin {
  return {
    name: 'robots',
    apply: 'build',
    applyToEnvironment: (env) => env.name === 'client',
    generateBundle() {
      this.emitFile({type: 'asset', fileName: 'robots.txt', source: renderRobots(opts.siteUrl)});
    },
  };
}
