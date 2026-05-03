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

export {i18n};
