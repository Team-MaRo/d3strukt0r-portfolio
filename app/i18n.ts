import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';
import de from './locales/de.yml';
import en from './locales/en.yml';

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {translation: en},
        de: {translation: de},
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'de'],
      interpolation: {escapeValue: false},
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'd3strukt0rs-portfolio:lang',
        caches: ['localStorage'],
      },
      returnObjects: true,
    });
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
