import type {LoaderFunctionArgs} from 'react-router';
import {posts} from '~/lib/content';
import {resolveSiteUrl} from '~/lib/site-url';
import {renderAtom} from '~/vite/plugins/atom';

// SSR-only resource route; the SPA build emits a static `atom.xml` instead via
// the `atom` plugin; both go through its `renderAtom`. Host resolved per request.
export function loader({request}: LoaderFunctionArgs): Response {
  const siteUrl = resolveSiteUrl(request);
  const xml = renderAtom(
    siteUrl,
    posts,
    {name: 'Manuele', email: 'gh-contact@d3st.dev'},
    new Date(),
  );
  return new Response(xml, {
    headers: {'content-type': 'application/atom+xml; charset=utf-8'},
  });
}
