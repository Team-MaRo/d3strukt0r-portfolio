import type {Route} from './+types/root';
import {useEffect} from 'react';
import {I18nextProvider, useTranslation} from 'react-i18next';
import {isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation} from 'react-router';
import {CustomCursor} from './components/CustomCursor';
import {TaBg} from './components/TaBg';
import {TaFooter} from './components/TaFooter';
import {TaNav} from './components/TaNav';
import {TaTerminal} from './components/TaTerminal';
import {smoothScrollToAnchor} from './hooks/useInternalLinkNav';
import {useReveal} from './hooks/useReveal';
import {useTheme} from './hooks/useTheme';
import {i18n} from './i18n';

import './styles/tailwind.css';
import './styles/main.scss';

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

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#060614" />
        <meta name="apple-mobile-web-app-title" content="Manueles Portfolio" />
        <Meta />
        <Links />
        <script
          // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- inline script must run before hydration to set the JS class on <html>
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.classList.add(\'js\')',
          }}
        />
      </head>
      <body className="ta dark">
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Sync body class with theme preference + run global hooks.
  useTheme();
  useReveal();
  const {i18n} = useTranslation();
  const loc = useLocation();
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
