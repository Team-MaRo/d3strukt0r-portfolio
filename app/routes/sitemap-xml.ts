import type {LoaderFunctionArgs} from 'react-router';
import {posts} from '~/lib/content';
import {postPath, resolveSiteUrl} from '~/lib/site-url';
import {renderSitemap} from '~/vite/plugins/sitemap';

// SSR-only resource route (registered in `routes.ts` when SSR is on). The SPA
// build emits a static `sitemap.xml` instead via the `sitemap` plugin; both go
// through its `renderSitemap`. Host resolved per request.
export async function loader({request}: LoaderFunctionArgs): Promise<Response> {
  const siteUrl = resolveSiteUrl(request);
  const paths = ['/', '/cv', '/blog', ...posts.map(postPath)];
  return new Response(await renderSitemap(siteUrl, paths), {
    headers: {'content-type': 'application/xml; charset=utf-8'},
  });
}
