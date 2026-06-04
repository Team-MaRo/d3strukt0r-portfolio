import type {Route} from './+types/root';
import type {CipherText} from './lib/seal';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation} from 'react-router';
import {CustomCursor} from './components/CustomCursor';
import {TaBg} from './components/TaBg';
import {TaFooter} from './components/TaFooter';
import {TaNav} from './components/TaNav';
import {TaTerminal} from './components/TaTerminal';
import {Card} from './components/ui/card';
import {smoothScrollToAnchor} from './hooks/useInternalLinkNav';
import {THEME_COLOR_DARK, THEME_COLOR_LIGHT, useTheme} from './hooks/useTheme';
import {isLang, LANG_STORAGE} from './i18n-config';
import {setWrapped} from './lib/seal';

import './styles/tailwind.css';
import './styles/main.scss';

// Hand the runtime-wrapped data keys to the client. The client reads
// `wrapped` from this loader and merges it into the seal store via
// `setWrapped()` (see `App` below). In SPA builds, the loader runs in the
// browser and returns `null`, so the client falls back to the wrapped[]
// baked into `virtual:sealed-secrets` at build time.
//
// The dynamic `./lib/seal.server` import lives inside this loader on
// purpose: React Router only strips server-only code from `loader`,
// `action`, `middleware`, and `headers` exports. A top-level reference
// would leak into the client bundle and Vite would refuse to compile the
// `.server.ts` for it. As a side effect we lose strict fail-at-boot — a
// misconfigured deployment instead fails at the first SSR request (the
// import resolves, seal.server's module-init runs, the synchronous env
// check throws, the loader rejects, the request 500s with the seal error).
export async function loader(): Promise<{wrapped: CipherText[] | null; now: number}> {
  // Request-time "now", serialized to the client so render-time durations/dates
  // match across server and client (see `app/hooks/useNow.ts`). Read here in
  // the loader's request context — on Cloudflare the clock is only frozen
  // during module-init, not during request handling.
  const now = Date.now();
  if (!import.meta.env.SSR) {
    return {wrapped: null, now};
  }
  // SPA builds (`ssr: false`) still invoke this loader once during
  // index.html prerender with `import.meta.env.SSR === true`. In that
  // pass, seal.server.ts's `secrets.salt` is the *server* bundle's salt,
  // which differs from the *client* bundle's salt — wrapping with it
  // produces a `wrapped[]` no client password can unwrap. Detect SPA via
  // a non-empty build-time `secrets.wrapped` and skip runtime wrap.
  const {default: secrets} = await import('virtual:sealed-secrets');
  if (secrets.wrapped.length > 0) {
    return {wrapped: null, now};
  }
  const {getWrappedKeys} = await import('./lib/seal.server');
  return {wrapped: await getWrappedKeys(), now};
}

export const links: Route.LinksFunction = () => [
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous'},
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },
  {rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png'},
  {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
  {rel: 'shortcut icon', href: '/favicon.ico'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
  {rel: 'manifest', href: '/site.webmanifest'},
  {rel: 'alternate', type: 'application/atom+xml', title: 'Manuele', href: '/atom.xml'},
];

// Pre-hydration bootstrap. Runs in <head> before stylesheets evaluate — writes
// to <html> (`document.documentElement`) because <body> doesn't exist yet
// during head parsing. Putting the theme class on the root element pre-CSS-eval
// means body inherits the right variable cascade from its first computed style,
// so the per-utility colour cross-fade in `_base.scss` has nothing to animate on
// load (no FOUC). Three jobs:
//   1. Sets html.light / html.dark for the first paint. Reads localStorage;
//      with no stored pref defaults to DARK, but still honours an explicit
//      `prefers-color-scheme: light` so a light-OS first-time visitor isn't
//      forced into dark.
//   2. Adds `html.js` so any `no-js`-scoped CSS escape hatches activate.
//   3. Overrides every `<meta name="theme-color">` content so the mobile
//      browser chrome (address-bar strip) follows the in-page theme even when
//      it disagrees with the OS preference.
// Kept minified to one line for the fastest parse before hydration.
// eslint-disable-next-line style/max-len -- inline IIFE intentionally minified to one line for fastest parse before hydration (avoids theme FOUC)
const themeBootstrap = `(function(){try{var k='d3strukt0rs-portfolio:theme';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.classList.add(t,'js');var c=t==='dark'?'${THEME_COLOR_DARK}':'${THEME_COLOR_LIGHT}';document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',c);});}catch(e){document.documentElement.classList.add('dark','js');}})();`;

export function Layout({children}: {children: React.ReactNode}) {
  // Provider lives in the entry files (above the router), so `useTranslation`
  // resolves here. `lang` tracks the rendered language: on the server it's the
  // request-detected language, on the client's first paint it's the same value
  // (entry.client seeds i18n from this very attribute), and it updates live
  // when the user switches.
  const {i18n} = useTranslation();
  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Both metas ship; the inline bootstrap below overrides both content
            attrs to the chosen theme — whichever the browser picks via the
            `media` query then shows the right colour regardless. */}
        <meta name="theme-color" content={THEME_COLOR_LIGHT} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={THEME_COLOR_DARK} media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-title" content="Manueles Portfolio" />
        {/* Must run before <Links /> so the theme class is on <html> before any
            stylesheet evaluates — that's what prevents the FOUC. */}
        <script
          // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- themeBootstrap is a constant string defined above; no user input, no escaping needed
          dangerouslySetInnerHTML={{__html: themeBootstrap}}
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Sync theme preference + run global hooks. Scroll reveals are now per-section
  // GSAP via <Reveal> (visible-by-default), not a global IntersectionObserver.
  useTheme();
  const {i18n} = useTranslation();
  const loc = useLocation();
  const data = useLoaderData<typeof loader>();
  if (data?.wrapped != null) {
    // Synchronous so the very first unlock attempt sees runtime-wrapped keys.
    // Idempotent: same array reference re-applied is a no-op.
    setWrapped(data.wrapped);
  }
  useEffect(() => {
    // One-shot reconcile to the stored preference. The server renders the
    // language from the `lng` cookie / Accept-Language, which normally already
    // equals the user's choice. In the rare case it doesn't (e.g. a stored
    // pref with no cookie yet on a browser whose Accept-Language differs), this
    // switches after hydration — a tolerated re-render, never a #418 — and the
    // detector writes the `lng` cookie so the next SSR is correct.
    try {
      const stored = localStorage.getItem(LANG_STORAGE);
      if (isLang(stored) && stored !== i18n.language) {
        void i18n.changeLanguage(stored);
      }
    } catch {
      // localStorage may throw in private mode / sandboxed contexts; ignore.
    }
    // Mount-only: reconcile once, then leave language to user actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loc.hash) {
      return;
    }
    const id = loc.hash.slice(1);
    const tryScroll = () => smoothScrollToAnchor(id);
    if (!tryScroll()) {
      // Target not yet mounted (cross-route nav). Retry on next frame.
      requestAnimationFrame(() => requestAnimationFrame(tryScroll));
    }
  }, [loc.pathname, loc.hash]);

  return (
    <>
      <TaBg />
      <CustomCursor />
      <TaNav />
      <main>
        <Outlet />
      </main>
      <TaFooter />
      <TaTerminal />
    </>
  );
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
  const {t} = useTranslation();

  // Mirror the example's logic: route error responses surface their status
  // (404 gets a dedicated copy), every other thrown value is a generic 500.
  // In dev only, an `Error` instance also exposes its message + stack so the
  // failing call site is visible; production ships the friendly copy alone.
  const isRouteError = isRouteErrorResponse(error);
  const status = isRouteError ? error.status : 500;
  const is404 = isRouteError && error.status === 404;

  const title = is404 ? t('error.not_found_title') : t('error.title');
  const sub = is404
    ? t('error.not_found_sub')
    : isRouteError && error.statusText
      ? error.statusText
      : t('error.sub');

  const isDev = import.meta.env.DEV;
  const details = isDev && error instanceof Error ? error.message : undefined;
  const stack = isDev && error instanceof Error ? error.stack : undefined;

  return (
    <section className="w-full pt-32 pb-20 md:pt-40">
      <div className="container">
        <Card glass className="px-6 py-20 text-center">
          <div className="font-mono text-sm text-muted-foreground">
            <span className="opacity-50">$</span> ./recover --status {status} ·{' '}
            <span className="text-primary">{is404 ? 'not found' : 'error'}</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{sub}</p>
          {details != null && <p className="mx-auto mt-4 max-w-lg font-mono text-xs text-muted-foreground">{details}</p>}
          {stack != null && (
            <pre className="ta-err-stack mx-auto mt-6 max-w-full overflow-auto rounded-lg p-4 text-left font-mono text-xs">
              <code>{stack}</code>
            </pre>
          )}
          <Link to="/" className="mt-6 inline-flex items-center gap-2 font-mono text-primary cursor-hover hover:underline">
            <span aria-hidden>→</span> {t('error.home')}
          </Link>
        </Card>
      </div>
    </section>
  );
}
