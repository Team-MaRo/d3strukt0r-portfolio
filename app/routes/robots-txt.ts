import type {LoaderFunctionArgs} from 'react-router';
import {resolveSiteUrl} from '~/lib/site-url';
import {renderRobots} from '~/vite/plugins/robots';

// SSR-only resource route; the SPA build emits a static `robots.txt` instead via
// the `robots` plugin; both go through its `renderRobots`. Host resolved per
// request.
export function loader({request}: LoaderFunctionArgs): Response {
  return new Response(renderRobots(resolveSiteUrl(request)), {
    headers: {'content-type': 'text/plain; charset=utf-8'},
  });
}
