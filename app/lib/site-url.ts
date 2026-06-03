import process from 'node:process';

const DATE_DASH_RE = /-/g;

// Resolves the site origin at runtime for the SSR resource routes: an explicit
// `SITE_HOST` env wins (e.g. set in docker-compose), else the proxied/requested
// host header, else the request URL's own host. The SPA build instead bakes the
// host in at build time (see `vite.config.ts`).
export function resolveSiteUrl(request: Request): string {
  const envHost = process.env.SITE_HOST?.trim();
  const host = envHost !== undefined && envHost !== ''
    ? envHost
    : request.headers.get('x-forwarded-host')
      ?? request.headers.get('host')
      ?? new URL(request.url).host;
  return `https://${host}`;
}

// Blog post path `/YYYY/MM/DD/slug` — shared by the sitemap + atom plugins
// (build) and the sitemap/atom SSR routes (runtime).
export function postPath(post: {date: string; slug: string}): string {
  return `/${post.date.slice(0, 10).replace(DATE_DASH_RE, '/')}/${post.slug}`;
}
