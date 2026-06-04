import type {i18n as I18n} from 'i18next';
import type {Lang} from './i18n-config';
import {createInstance} from 'i18next';
import {initReactI18next} from 'react-i18next';
import {baseInitOptions} from './i18n-config';

// Per-request i18n instance for SSR. A fresh instance per request (rather than
// the module singleton in `app/i18n.ts`) is mandatory in the Workers runtime:
// one isolate serves many concurrent requests, and a shared singleton's
// `language` would race across them. No language detector — the language is
// resolved from the request (`detectLanguage`) and passed in explicitly.
export async function createServerI18n(lng: Lang): Promise<I18n> {
  const instance = createInstance();
  await instance.use(initReactI18next).init({...baseInitOptions, lng});
  return instance;
}
