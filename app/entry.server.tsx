import type {EntryContext, RouterContextProvider} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {I18nextProvider} from 'react-i18next';
import {ServerRouter} from 'react-router';
import {createServerI18n} from './i18n.server';
import {detectLanguage} from './lib/detect-language';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  let shellRendered = false;
  const userAgent = request.headers.get('user-agent');

  // Per-request i18n resolved from the cookie / Accept-Language. The same
  // language is reflected into `<html lang>` (see root.tsx), which the client
  // reads back to hydrate without a mismatch.
  const i18n = await createServerI18n(detectLanguage(request));

  const body = await renderToReadableStream(
    <I18nextProvider i18n={i18n}>
      <ServerRouter context={routerContext} url={request.url} />
    </I18nextProvider>,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent != null && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
