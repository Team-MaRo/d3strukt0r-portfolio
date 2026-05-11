// Runtime password wrap for the SSR build (the Docker image).
//
// In an SSR build, `virtual:sealed-secrets`'s `wrapped[]` is empty (the build
// plugin only fills it for SPA builds where there's no server). At server
// start we read SEAL_DATA_KEY + REVEAL_PASSWORDS from the environment,
// derive one KEK per password against the build-time salt/iter, wrap the
// data key, and hand the resulting `wrapped[]` to the client via the root
// loader.
//
// The data key never reaches the client — only the wrapped versions do.
// This file imports `~/lib/seal-crypto`, which uses globalThis.crypto.subtle
// (available in Node 19+).

import type {CipherText} from './seal-crypto';
import process from 'node:process';
import secrets from 'virtual:sealed-secrets';
import {
  aesGcmEncrypt,
  b64decode,
  b64encode,
  deriveKEK,
  KEY_BYTES,
} from './seal-crypto';

// Strict in production (Docker runtime sets NODE_ENV=production); lenient
// in dev so `pnpm run dev` and the docker-compose dev service work without
// any env vars. The dev fallbacks here MUST match the ones in
// `app/vite/plugins/seal.ts` — the data key used to encrypt at build must
// equal the one used to wrap at runtime, otherwise nothing decrypts.
const isProd = process.env.NODE_ENV === 'production';

function readDataKey(): Uint8Array {
  const env = process.env.SEAL_DATA_KEY;
  if (env != null && env.length > 0) {
    const buf = b64decode(env);
    if (buf.length !== KEY_BYTES) {
      throw new Error(
        `[seal] SEAL_DATA_KEY must decode to ${KEY_BYTES} bytes (got ${buf.length}).`,
      );
    }
    return buf;
  }
  if (isProd) {
    throw new Error(
      '[seal] SEAL_DATA_KEY is not set. The server cannot wrap the data '
      + 'key for client unlocking. Set the env var on the deployment '
      + '(must match the value used at build time).',
    );
  }
  console.warn('[seal] SEAL_DATA_KEY not set — using deterministic dev key.');
  return new Uint8Array(KEY_BYTES);
}

function readPasswords(): string[] {
  const raw = process.env.REVEAL_PASSWORDS ?? '';
  const passwords = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (passwords.length > 0) {
    return passwords;
  }
  if (isProd) {
    throw new Error(
      '[seal] REVEAL_PASSWORDS is not set. Provide a comma-separated list '
      + 'of unlock passwords on the deployment env.',
    );
  }
  console.warn('[seal] REVEAL_PASSWORDS empty — using dev password "dev"');
  return ['dev'];
}

// Validate env synchronously at module init so a misconfigured deployment
// fails when the server boots (before serving the first request) instead of
// returning 500 later. Module init runs once per worker.
const DATA_KEY: Uint8Array = readDataKey();
const PASSWORDS: string[] = readPasswords();

// Fail-fast if SEAL_DATA_KEY doesn't match the value the bundle was built
// with. Without this, a mismatched runtime key wraps a "different" data key
// for clients — every password silently fails as "wrong" because the
// unwrapped key can't decrypt the fields baked into the client bundle.
async function verifyDataKeyHash(): Promise<void> {
  const hash = new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', DATA_KEY as unknown as BufferSource),
  );
  const runtime = b64encode(hash);
  if (runtime !== secrets.dataKeyHash) {
    throw new Error(
      '[seal] runtime SEAL_DATA_KEY does not match the value used at build time. '
      + 'The container would silently reject every password. Set the env var to the '
      + 'same value used by docker.yml\'s SEAL_DATA_KEY GitHub Actions secret.',
    );
  }
}
const dataKeyHashCheck = verifyDataKeyHash();
dataKeyHashCheck.catch(() => {});

async function computeWrappedKeys(): Promise<CipherText[]> {
  // Block on the hash check so a mismatch surfaces here (and rejects the
  // first SSR request loudly) rather than via the silent decrypt failure.
  await dataKeyHashCheck;
  const salt = b64decode(secrets.salt);
  const out: CipherText[] = [];
  for (const pw of PASSWORDS) {
    const kek = await deriveKEK(pw, salt, secrets.iter);
    out.push(await aesGcmEncrypt(kek, DATA_KEY));
  }
  return out;
}

// Eager: kick off PBKDF2 at module init too, so the first request doesn't
// pay the latency. The promise is cached for all subsequent calls.
const wrappedKeysReady: Promise<CipherText[]> = computeWrappedKeys();
// Don't trigger an unhandledRejection if the consumer hasn't awaited yet.
wrappedKeysReady.catch(() => {});

/** Memoized: derives + wraps once per worker. Restart the container to rotate REVEAL_PASSWORDS. */
export async function getWrappedKeys(): Promise<CipherText[]> {
  return wrappedKeysReady;
}
