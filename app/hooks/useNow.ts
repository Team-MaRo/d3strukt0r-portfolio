import {useRouteLoaderData} from 'react-router';

// Request-time "now" (epoch ms) stamped by the root loader and serialized to
// the client, so any render-time current-time value is identical on server and
// client — the precondition for clean hydration. Use this instead of
// `new Date()` for anything rendered during SSR: Cloudflare Workers freeze the
// clock during module-init, and even at render the server and client clocks
// differ, either of which can trip a React #418 text mismatch.
//
// Falls back to the live clock for client-side navigations where the root
// loader data isn't present (post-hydration only, so no mismatch risk).
export function useNow(): number {
  const data = useRouteLoaderData('root');
  const now = data?.now;
  return typeof now === 'number' ? now : Date.now();
}
