import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';
import {baseInitOptions, LANG_COOKIE, LANG_STORAGE} from './i18n-config';
import de from './locales/de.yml';
import en from './locales/en.yml';

// Client-side i18n singleton. Initialised once from `entry.client.tsx` with the
// language the server already rendered (`initClientI18n(lng)`), so the first
// client render is byte-identical to the SSR output — no hydration mismatch.
// The detector still governs later switches and writes BOTH caches: the
// localStorage pref (unchanged key) and the `lng` cookie the server reads on
// the next request.
//
// Resources are imported here (not pulled from `i18n-config`) so the HMR block
// below has a direct dependency edge on the locale YAMLs; the content is
// identical to `baseInitOptions.resources`, which the server instance uses.
export function initClientI18n(lng?: string) {
  if (!i18n.isInitialized) {
    void i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        ...baseInitOptions,
        resources: {en: {translation: en}, de: {translation: de}},
        // Force the initial language to match the server. Detection still runs
        // its caches on `changeLanguage`, but does not pick the initial value.
        ...(lng != null && lng !== '' ? {lng} : {}),
        detection: {
          order: ['cookie', 'localStorage', 'navigator'],
          lookupCookie: LANG_COOKIE,
          lookupLocalStorage: LANG_STORAGE,
          caches: ['localStorage', 'cookie'],
        },
      });
  }
  return i18n;
}

// Hot-reload translations on YAML edit. Vite re-imports the locale module
// when it changes but the init guard above skips re-init, so resource
// bundles would stay stale otherwise. addResourceBundle merges + overwrites,
// changeLanguage forces react-i18next subscribers to re-render.
if (import.meta.hot) {
  import.meta.hot.accept('./locales/de.yml', (m) => {
    if (m) {
      i18n.addResourceBundle('de', 'translation', m.default, true, true);
      void i18n.changeLanguage(i18n.language);
    }
  });
  import.meta.hot.accept('./locales/en.yml', (m) => {
    if (m) {
      i18n.addResourceBundle('en', 'translation', m.default, true, true);
      void i18n.changeLanguage(i18n.language);
    }
  });
}

export {i18n};
