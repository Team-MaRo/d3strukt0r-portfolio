import type {Route} from './+types/root';
import type {CipherText} from './lib/seal';
import {useEffect} from 'react';
import {I18nextProvider, useTranslation} from 'react-i18next';
import {isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation} from 'react-router';
import {CustomCursor} from './components/CustomCursor';
import {TaBg} from './components/TaBg';
import {TaFooter} from './components/TaFooter';
import {TaNav} from './components/TaNav';
import {TaTerminal} from './components/TaTerminal';
import {smoothScrollToAnchor} from './hooks/useInternalLinkNav';
import {THEME_COLOR_DARK, THEME_COLOR_LIGHT, useTheme} from './hooks/useTheme';
import {i18n} from './i18n';
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
export async function loader(): Promise<{wrapped: CipherText[] | null}> {
  if (!import.meta.env.SSR) {
    return {wrapped: null};
  }
  // SPA builds (`ssr: false`) still invoke this loader once during
  // index.html prerender with `import.meta.env.SSR === true`. In that
  // pass, seal.server.ts's `secrets.salt` is the *server* bundle's salt,
  // which differs from the *client* bundle's salt — wrapping with it
  // produces a `wrapped[]` no client password can unwrap. Detect SPA via
  // a non-empty build-time `secrets.wrapped` and skip runtime wrap.
  const {default: secrets} = await import('virtual:sealed-secrets');
  if (secrets.wrapped.length > 0) {
    return {wrapped: null};
  }
  const {getWrappedKeys} = await import('./lib/seal.server');
  return {wrapped: await getWrappedKeys()};
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
  return (
    <html lang="en" suppressHydrationWarning>
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
      <body className="ta" suppressHydrationWarning>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
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
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);
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
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';
  return (
    <main className="ta-err-main">
      <h1>{message}</h1>
    </main>
  );
}
