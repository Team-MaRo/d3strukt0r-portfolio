import {describe, expect, it} from 'vitest';
import {detectLanguage} from './detect-language';

function req(headers: Record<string, string>): Request {
  return new Request('https://d3strukt0r.dev/', {headers});
}

describe('detectLanguage', () => {
  it('prefers a valid lng cookie', () => {
    expect(detectLanguage(req({Cookie: 'lng=de'}))).toBe('de');
    expect(detectLanguage(req({Cookie: 'foo=1; lng=en; bar=2'}))).toBe('en');
  });

  it('cookie wins over Accept-Language', () => {
    expect(detectLanguage(req({Cookie: 'lng=en', 'Accept-Language': 'de-DE,de;q=0.9'}))).toBe('en');
  });

  it('falls back to Accept-Language when the cookie is missing or unsupported', () => {
    expect(detectLanguage(req({'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'}))).toBe('de');
    expect(detectLanguage(req({Cookie: 'lng=fr', 'Accept-Language': 'de;q=0.9'}))).toBe('de');
  });

  it('picks the first supported tag in Accept-Language', () => {
    expect(detectLanguage(req({'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'}))).toBe('en');
  });

  it('falls back to en when nothing matches', () => {
    expect(detectLanguage(req({}))).toBe('en');
    expect(detectLanguage(req({'Accept-Language': 'fr-FR,es;q=0.9'}))).toBe('en');
  });

  it('handles a url-encoded cookie value', () => {
    expect(detectLanguage(req({Cookie: 'lng=%64%65'}))).toBe('de');
  });
});
