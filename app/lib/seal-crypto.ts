// Shared crypto primitives for the seal pipeline. Used by:
//   - app/vite/plugins/seal.ts (Node, build-time encryption)
//   - app/lib/seal.server.ts   (Node, runtime password wrap)
//   - app/lib/seal.ts          (browser, runtime unwrap + decrypt)
//
// Algorithm: PBKDF2-SHA256 → AES-GCM-256. Same KDF iterations + IV/salt sizes
// across all consumers so wrapped keys round-trip cleanly between build and
// browser.

export const PBKDF2_ITER = 600_000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const KEY_BYTES = 32;

export interface CipherText {
  ct: string;
  iv: string;
}

const SUBTLE = globalThis.crypto.subtle;

// `Buffer` is intentionally referenced as a runtime global rather than imported
// from `node:buffer` so this module can be tree-shaken cleanly into the
// browser bundle (where `node:buffer` would force a polyfill).
/* eslint-disable node/prefer-global/buffer */
export function b64encode(u: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(u).toString('base64');
  }
  let s = '';
  for (let i = 0; i < u.length; i++) {
    s += String.fromCharCode(u[i]!);
  }
  return btoa(s);
}

export function b64decode(s: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(s, 'base64'));
  }
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}
/* eslint-enable node/prefer-global/buffer */

// Coerce Uint8Array → BufferSource (TS strict balks at SharedArrayBuffer
// overload otherwise).
export function bs(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource;
}

export async function deriveKEK(pw: string, salt: Uint8Array, iter = PBKDF2_ITER): Promise<CryptoKey> {
  const km = await SUBTLE.importKey(
    'raw',
    bs(new TextEncoder().encode(pw)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return SUBTLE.deriveKey(
    {name: 'PBKDF2', salt: bs(salt), iterations: iter, hash: 'SHA-256'},
    km,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function importDataKey(rawDataKey: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  return SUBTLE.importKey(
    'raw',
    bs(rawDataKey),
    {name: 'AES-GCM', length: 256},
    false,
    usages,
  );
}

export async function aesGcmEncrypt(key: CryptoKey, data: Uint8Array): Promise<CipherText> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await SUBTLE.encrypt({name: 'AES-GCM', iv: bs(iv)}, key, bs(data));
  return {ct: b64encode(new Uint8Array(ct)), iv: b64encode(iv)};
}

export async function aesGcmDecrypt(key: CryptoKey, ct: CipherText): Promise<Uint8Array> {
  const iv = b64decode(ct.iv);
  const ctBytes = b64decode(ct.ct);
  const buf = await SUBTLE.decrypt({name: 'AES-GCM', iv: bs(iv)}, key, bs(ctBytes));
  return new Uint8Array(buf);
}
