// Runtime side of the build-time encryption pipeline (see
// `app/vite/plugins/seal.ts`). Holds the unlocked plaintext map + photo
// blob URLs in module state, persists the raw data key in sessionStorage so
// navigations within the tab stay unlocked, and exposes a tiny store +
// helpers for components.
//
// `wrapped[]` (the per-password wrapped data keys) lives in a mutable
// module-local ref so the SSR root loader can hand fresh runtime-wrapped
// keys to the client via `setWrapped`. SPA builds bake a non-empty
// `secrets.wrapped` at build time; SSR builds ship `wrapped: []` and the
// loader supplies it.

import type {CipherText} from './seal-crypto';
import photos from 'virtual:sealed-photos';
import secrets from 'virtual:sealed-secrets';
import {
  aesGcmDecrypt,
  b64decode,
  b64encode,
  bs,
  deriveKEK,
  importDataKey,
} from './seal-crypto';

export type {CipherText} from './seal-crypto';

export interface SealedSecrets {
  v: 1;
  iter: number;
  salt: string;
  wrapped: CipherText[];
  fields: Record<string, CipherText>;
}

export interface SealedPhotoMeta {
  hash: string;
  w: number;
  h: number;
  mime: string;
}

const SEAL_OPEN_RE = /\0SEAL:([^\0]+)\0/g;
const SEAL_FULL_RE = /^\0SEAL:([^\0]+)\0$/;
const PHOTO_FIELD_PREFIX = 'photo:';

const SS_KEY = 'portfolio:seal:dataKey';
const FAIL_KEY = 'portfolio:seal:fail';
const COOLDOWN_MS = 30_000;
const MAX_FAILS = 5;

export type UnlockResult = 'ok' | 'wrong' | 'cooldown';

export interface SealState {
  unlocked: boolean;
  cooldownUntil: number;
  failCount: number;
  lastError: string | null;
}

let state: SealState = {
  unlocked: false,
  cooldownUntil: 0,
  failCount: 0,
  lastError: null,
};

const plaintext = new Map<string, string>();
const photoUrls = new Map<string, string>();

const listeners = new Set<() => void>();

// Mutable ref for runtime-supplied wrapped keys (see file header).
let currentWrapped: CipherText[] = secrets.wrapped;

export function setWrapped(w: CipherText[]): void {
  currentWrapped = w;
}

function notify() {
  for (const fn of listeners) {
    fn();
  }
}

function setState(patch: Partial<SealState>) {
  state = {...state, ...patch};
  notify();
}

export function getState(): SealState {
  return state;
}

export function getUnlocked(): boolean {
  return state.unlocked;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSealed(value: unknown): value is string {
  return typeof value === 'string' && SEAL_FULL_RE.test(value);
}

export function sealedId(value: string): string | null {
  const m = SEAL_FULL_RE.exec(value);
  return m?.[1] ?? null;
}

/**
 * Resolve a possibly-sealed string. Returns plaintext when unlocked, the
 * fallback when locked, or the original string when not sealed.
 */
export function reveal(value: string, fallback = '•••'): string {
  const id = sealedId(value);
  if (id == null) {
    return value;
  }
  return plaintext.get(id) ?? fallback;
}

/**
 * Strip every sentinel from a multi-line / mixed string, replacing each with
 * its plaintext (when unlocked) or the fallback. Useful for the terminal
 * easter-egg or any place that prints raw blobs.
 */
export function revealAll(input: string, fallback = '•••'): string {
  return input.replace(SEAL_OPEN_RE, (_match, id: string) => plaintext.get(id) ?? fallback);
}

export function getPhotoMeta(id: string): SealedPhotoMeta | null {
  return photos[id] ?? null;
}

export function getPhotoUrl(id: string): string | null {
  return photoUrls.get(id) ?? null;
}

async function tryUnwrap(pw: string): Promise<Uint8Array | null> {
  if (currentWrapped.length === 0) {
    return null;
  }
  const salt = b64decode(secrets.salt);
  const kek = await deriveKEK(pw, salt, secrets.iter);
  for (const wrap of currentWrapped) {
    try {
      return await aesGcmDecrypt(kek, wrap);
    } catch {
      // wrong slot, try next
    }
  }
  return null;
}

async function applyKey(rawDataKey: Uint8Array): Promise<void> {
  const dataKey = await importDataKey(rawDataKey, ['decrypt']);

  // Revoke any leftover URLs from a previous unlock cycle.
  for (const url of photoUrls.values()) {
    URL.revokeObjectURL(url);
  }
  photoUrls.clear();
  plaintext.clear();

  const dec = new TextDecoder();
  const ids = Object.keys(secrets.fields);
  await Promise.all(ids.map(async (id) => {
    const f = secrets.fields[id];
    if (f == null) {
      return;
    }
    const buf = await aesGcmDecrypt(dataKey, f);
    if (id.startsWith(PHOTO_FIELD_PREFIX)) {
      const photoId = id.slice(PHOTO_FIELD_PREFIX.length);
      const meta = photos[photoId];
      const mime = meta?.mime ?? 'application/octet-stream';
      const blob = new Blob([bs(buf)], {type: mime});
      photoUrls.set(photoId, URL.createObjectURL(blob));
    } else {
      plaintext.set(id, dec.decode(buf));
    }
  }));
}

export async function unlock(pw: string): Promise<UnlockResult> {
  if (state.cooldownUntil > Date.now()) {
    setState({lastError: 'cooldown'});
    return 'cooldown';
  }
  const raw = await tryUnwrap(pw);
  if (raw == null) {
    const fails = state.failCount + 1;
    const cooldown = fails >= MAX_FAILS ? Date.now() + COOLDOWN_MS : 0;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(FAIL_KEY, String(fails));
    }
    setState({
      failCount: fails,
      cooldownUntil: cooldown,
      lastError: 'wrong',
    });
    return 'wrong';
  }
  await applyKey(raw);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SS_KEY, b64encode(raw));
    sessionStorage.removeItem(FAIL_KEY);
  }
  setState({unlocked: true, failCount: 0, cooldownUntil: 0, lastError: null});
  return 'ok';
}

export function lock(): void {
  plaintext.clear();
  for (const url of photoUrls.values()) {
    URL.revokeObjectURL(url);
  }
  photoUrls.clear();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SS_KEY);
  }
  setState({unlocked: false, lastError: null});
}

let hydrated = false;

/** Re-apply a key cached in sessionStorage. Called once on mount. */
export async function hydrate(): Promise<void> {
  if (hydrated) {
    return;
  }
  hydrated = true;
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const stored = sessionStorage.getItem(SS_KEY);
  const fails = Number(sessionStorage.getItem(FAIL_KEY) ?? '0');
  if (fails > 0) {
    setState({failCount: fails});
  }
  if (stored == null) {
    return;
  }
  try {
    const raw = b64decode(stored);
    await applyKey(raw);
    setState({unlocked: true});
  } catch {
    sessionStorage.removeItem(SS_KEY);
  }
}
