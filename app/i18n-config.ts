import type {InitOptions} from 'i18next';
import de from './locales/de.yml';
import en from './locales/en.yml';

// Single isomorphic source of truth for i18next, imported by both the client
// singleton (`app/i18n.ts`) and the per-request server instance
// (`app/i18n.server.ts`). Keeping resources + options here guarantees the
// server and client render from identical bundles — the precondition for a
// clean hydration.

export const SUPPORTED_LNGS = ['en', 'de'] as const;
export type Lang = (typeof SUPPORTED_LNGS)[number];
export const FALLBACK_LNG: Lang = 'en';

// localStorage key (unchanged — pre-existing user prefs live here). Contains a
// `:`, which isn't a valid cookie-name token, so the cookie cache uses the
// clean name below instead. The two stay in sync via the detector's caches.
export const LANG_STORAGE = 'd3strukt0rs-portfolio:lang';
// Cookie name the client detector writes and the server reads to render the
// right language on the first (SSR) paint.
export const LANG_COOKIE = 'lng';

export function isLang(value: string | null | undefined): value is Lang {
  return value != null && (SUPPORTED_LNGS as readonly string[]).includes(value);
}

export const resources = {
  en: {translation: en},
  de: {translation: de},
};

// Shared base options. The client adds a `detection` block (browser-only);
// the server passes an explicit `lng`. `useSuspense: false` keeps SSR free of
// suspense boundaries — resources are bundled synchronously, so `t()` resolves
// immediately and there's nothing to suspend on.
export const baseInitOptions = {
  resources,
  fallbackLng: FALLBACK_LNG,
  supportedLngs: [...SUPPORTED_LNGS],
  interpolation: {escapeValue: false},
  returnObjects: true,
  react: {useSuspense: false},
} satisfies InitOptions;
