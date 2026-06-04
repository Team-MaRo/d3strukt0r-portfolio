import type {Lang} from '~/i18n-config';
import {FALLBACK_LNG, isLang, LANG_COOKIE} from '~/i18n-config';

// Server-side language detection. Pure (no DOM) so it runs in the Cloudflare
// Workers runtime and is unit-testable. Resolution order mirrors the client
// detector so server and client agree on the first paint:
//   1. `LANG_COOKIE` cookie — the user's stored choice (the browser detector
//      writes it on every `changeLanguage`).
//   2. `Accept-Language` header — agrees with `navigator.language` for a
//      first-time visitor who has no cookie yet.
//   3. `FALLBACK_LNG`.
export function detectLanguage(request: Request): Lang {
  const fromCookie = readCookie(request.headers.get('Cookie'), LANG_COOKIE);
  if (isLang(fromCookie)) {
    return fromCookie;
  }

  const accept = request.headers.get('Accept-Language') ?? '';
  for (const part of accept.split(',')) {
    const tag = part.split(';')[0]?.trim().slice(0, 2).toLowerCase();
    if (isLang(tag)) {
      return tag;
    }
  }

  return FALLBACK_LNG;
}

function readCookie(header: string | null, name: string): string | undefined {
  if (header == null) {
    return undefined;
  }
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) {
      continue;
    }
    if (pair.slice(0, idx).trim() === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return undefined;
}
