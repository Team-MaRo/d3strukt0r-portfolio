import {startTransition} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {I18nextProvider} from 'react-i18next';
import {HydratedRouter} from 'react-router/dom';
import {initClientI18n} from './i18n';

// Initialise i18n with the language the server rendered. The server set
// `<html lang>` to its detected language; reading it back here forces the first
// client render to match the SSR output exactly — the precondition for a clean
// hydration. After mount the detector + the reconcile effect in `root.tsx`
// take over.
const i18n = initClientI18n(document.documentElement.lang || undefined);

startTransition(() => {
  hydrateRoot(
    document,
    <I18nextProvider i18n={i18n}>
      <HydratedRouter />
    </I18nextProvider>,
  );
});
