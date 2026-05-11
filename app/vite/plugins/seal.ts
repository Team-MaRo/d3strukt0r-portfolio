// Build-time encryption of sensitive fields and image assets.
//
// Two consumption modes, switched via the `SSR` env var (the same one
// `react-router.config.ts` reads — defaults to true; GitHub Pages sets it
// to `false` to opt into SPA output):
//
//   - SPA build (`SSR=false`, GitHub Pages): the data key is wrapped under
//     each `REVEAL_PASSWORDS` entry at build time and the wrapped keys are
//     baked into `virtual:sealed-secrets`. No server runs in production, so
//     passwords MUST be known at build time (matches the legacy flow).
//
//   - SSR build (default, e.g. the Docker image): `wrapped[]` is left empty
//     in `virtual:sealed-secrets`. The data key is read from `SEAL_DATA_KEY`
//     (so it isn't bundled into the image) and re-wrapped at server start by
//     `app/lib/seal.server.ts` against `process.env.REVEAL_PASSWORDS`. This
//     lets the operator rotate the password list with a container restart
//     instead of a rebuild.
//
// Either way, fields/photos are encrypted under the same per-build random
// data key, decrypted client-side once the user enters a password that
// successfully unwraps it (PBKDF2-SHA256 → AES-GCM-256, see seal-crypto.ts).
//
// `SEAL_DATA_KEY` (32-byte base64) is the long-lived secret. In CI it's a
// GitHub repo secret; in deployment it's an env var on the host. When the
// var is missing AND `NODE_ENV !== 'production'`, the plugin synthesizes a
// deterministic dev key so contributors don't need to set anything.
//
// Sensitive yml values are replaced in-place with sentinel strings of the
// form `\0SEAL:<id>\0`. Consumers wrap any potentially-sealed string in
// <Sealed value={...}> which detects the sentinel and renders a blurred
// lock placeholder until the user enters a valid password.
//
// Photos declared under `photos:` in sensitive.yml are encrypted under
// field id `photo:<id>` and the metadata (blurhash, dimensions, mime type)
// is exposed via the photo manifest. Use `<SealedImage id="<id>" />` in JSX.

import type {Plugin} from 'vite';
import type {CipherText} from '../../lib/seal-crypto';
import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {dirname, extname, isAbsolute, join, resolve} from 'node:path';
import process from 'node:process';
import {encode as blurhashEncode} from 'blurhash';
import jpeg from 'jpeg-js';
import yaml from 'js-yaml';
import {
  aesGcmEncrypt,
  b64encode,

  deriveKEK,
  importDataKey,
  KEY_BYTES,
  PBKDF2_ITER,
  SALT_BYTES,
} from '../../lib/seal-crypto';

export const SEAL_OPEN = '\0SEAL:';
export const SEAL_CLOSE = '\0';

const VIRTUAL_SECRETS = 'virtual:sealed-secrets';
const VIRTUAL_PHOTOS = 'virtual:sealed-photos';
const RESOLVED_SECRETS = `\0${VIRTUAL_SECRETS}`;
const RESOLVED_PHOTOS = `\0${VIRTUAL_PHOTOS}`;
const SEALED_YML_PREFIX = '\0sealed-yml:';
export const PHOTO_FIELD_PREFIX = 'photo:';

export interface SealedSecrets {
  v: 1;
  iter: number;
  salt: string;
  // SHA-256(dataKey), b64. seal.server.ts compares this to its runtime
  // SEAL_DATA_KEY at boot — mismatch surfaces as a startup error instead
  // of silent "wrong password" for every unlock attempt.
  dataKeyHash: string;
  wrapped: CipherText[];
  fields: Record<string, CipherText>;
}

export interface SealedPhotoMeta {
  hash: string;
  w: number;
  h: number;
  mime: string;
}

interface Options {
  /** Project root. Photo paths in sensitive.yml are resolved against this. */
  rootDir: string;
  /** Folder containing the linkedin yml files. */
  contentDir: string;
  /** Path to sensitive.yml (declares fields + photos). */
  sensitiveFile: string;
}

interface SensitiveSpec {
  fields?: Record<string, string[]>;
  photos?: Record<string, string>;
}

interface BuildState {
  secrets: SealedSecrets;
  photos: Record<string, SealedPhotoMeta>;
  /** Absolute yml path → synthetic resolved id. */
  ymlAlias: Map<string, string>;
  /** Synthetic resolved id → JS module source. */
  ymlSource: Map<string, string>;
}

function mimeFor(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    return 'image/jpeg';
  }
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  return 'application/octet-stream';
}

interface DecodedRGBA {
  data: Uint8Array;
  width: number;
  height: number;
}

function decodeImageForBlurhash(buf: Buffer, path: string): DecodedRGBA | null {
  const ext = extname(path).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    const decoded = jpeg.decode(buf, {useTArray: true});
    return {data: decoded.data, width: decoded.width, height: decoded.height};
  }
  // Other formats: skip blurhash (no pure-js PNG decoder bundled). Caller
  // will fall back to a flat hash so the encryption path still works.
  return null;
}

const FALLBACK_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // generic dark gradient

// configResolved + typegen each fire the plugin lifecycle separately, so we
// dedupe the dev-fallback warnings to avoid a triple-printed scary banner
// before the actual strict pass throws.
let warnedNoDataKey = false;
let warnedNoPasswords = false;

function resolveDataKey(strict: boolean): Uint8Array {
  const env = process.env.SEAL_DATA_KEY;
  if (env != null && env.length > 0) {
    const buf = Buffer.from(env, 'base64');
    if (buf.length !== KEY_BYTES) {
      throw new Error(
        `[seal] SEAL_DATA_KEY must decode to ${KEY_BYTES} bytes (got ${buf.length}). `
        + 'Generate one with: openssl rand -base64 32',
      );
    }
    return new Uint8Array(buf);
  }
  if (strict) {
    throw new Error(
      '[seal] SEAL_DATA_KEY is required in production builds. '
      + 'Generate one with: openssl rand -base64 32',
    );
  }
  if (!warnedNoDataKey) {
    warnedNoDataKey = true;
    console.warn(
      '[seal] SEAL_DATA_KEY not set — using deterministic dev key. '
      + 'Set the env var for production builds.',
    );
  }
  // Deterministic dev key (zeros). Never used outside `NODE_ENV !== 'production'`.
  return new Uint8Array(KEY_BYTES);
}

function resolveBuildPasswords(strict: boolean): string[] {
  const raw = process.env.REVEAL_PASSWORDS ?? '';
  const passwords = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (passwords.length === 0) {
    if (strict) {
      throw new Error(
        '[seal] REVEAL_PASSWORDS is required for SPA builds (SSR=false) '
        + 'in production. Set comma-separated unlock passwords.',
      );
    }
    if (!warnedNoPasswords) {
      warnedNoPasswords = true;
      console.warn('[seal] REVEAL_PASSWORDS empty — using dev password "dev"');
    }
    return ['dev'];
  }
  return passwords;
}

async function build(opts: Options, strict: boolean): Promise<BuildState> {
  const isSpaBuild = process.env.SSR === 'false';

  const dataKeyRaw = resolveDataKey(strict);
  const dataKey = await importDataKey(dataKeyRaw, ['encrypt']);
  // PBKDF2 salt + boot-time fingerprint are derived from the data key so
  // both Vite environments (client + server in React Router framework mode)
  // bake identical values without sharing process state. The data key is
  // public-from-the-attacker's-perspective once they have the bundle (it's
  // wrapped under each password), so deriving the salt from it leaks
  // nothing new; SHA-256 is one-way so neither value reveals the key.
  const dataKeyHashBytes = new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', dataKeyRaw as unknown as BufferSource),
  );
  const salt = dataKeyHashBytes.slice(0, SALT_BYTES);

  // SPA build (no server runtime): wrap with build-time passwords now.
  // SSR build: leave wrapped[] empty; the runtime fills it in via
  // `app/lib/seal.server.ts` from process.env.REVEAL_PASSWORDS.
  const wrapped: CipherText[] = [];
  if (isSpaBuild) {
    const passwords = resolveBuildPasswords(strict);
    for (const pw of passwords) {
      const kek = await deriveKEK(pw, salt, PBKDF2_ITER);
      wrapped.push(await aesGcmEncrypt(kek, dataKeyRaw));
    }
  }

  const fields: Record<string, CipherText> = {};
  const ymlAlias = new Map<string, string>();
  const ymlSource = new Map<string, string>();
  const photos: Record<string, SealedPhotoMeta> = {};

  const spec = yaml.load(readFileSync(opts.sensitiveFile, 'utf8')) as SensitiveSpec | null;
  if (spec == null || typeof spec !== 'object') {
    throw new Error('[seal] sensitive.yml must be a mapping with `fields` and/or `photos` keys');
  }

  // --- Field encryption ----------------------------------------------------
  const fieldSpec = spec.fields ?? {};
  for (const fileKey of Object.keys(fieldSpec)) {
    const paths = fieldSpec[fileKey] ?? [];
    for (const lang of ['de', 'en'] as const) {
      const ymlPath = join(opts.contentDir, `${fileKey}.${lang}.yml`);
      let raw: string;
      try {
        raw = readFileSync(ymlPath, 'utf8');
      } catch {
        continue;
      }
      const data = yaml.load(raw);
      if (data == null) {
        continue;
      }
      for (const path of paths) {
        await sealPath(data, path.split('.'), [], fileKey, lang, dataKey, fields);
      }
      const aliasId = `${SEALED_YML_PREFIX}${fileKey}.${lang}`;
      ymlAlias.set(ymlPath, aliasId);
      ymlSource.set(aliasId, `export default ${JSON.stringify(data)};`);
    }
  }

  // --- Photo encryption ----------------------------------------------------
  const photoSpec = spec.photos ?? {};
  for (const photoId of Object.keys(photoSpec)) {
    const relPath = photoSpec[photoId];
    if (relPath == null || relPath.length === 0) {
      continue;
    }
    const absPath = isAbsolute(relPath) ? relPath : resolve(opts.rootDir, relPath);
    let buf: Buffer;
    try {
      buf = readFileSync(absPath);
    } catch (err) {
      console.warn(`[seal] photo "${photoId}" not sealed:`, (err as Error).message);
      continue;
    }
    let hash = FALLBACK_HASH;
    let width = 0;
    let height = 0;
    try {
      const decoded = decodeImageForBlurhash(buf, absPath);
      if (decoded != null) {
        width = decoded.width;
        height = decoded.height;
        hash = blurhashEncode(
          new Uint8ClampedArray(decoded.data),
          decoded.width,
          decoded.height,
          4,
          3,
        );
      }
    } catch (err) {
      console.warn(`[seal] blurhash failed for "${photoId}":`, (err as Error).message);
    }
    const ct = await aesGcmEncrypt(dataKey, new Uint8Array(buf));
    fields[`${PHOTO_FIELD_PREFIX}${photoId}`] = ct;
    photos[photoId] = {hash, w: width, h: height, mime: mimeFor(absPath)};
  }

  const secrets: SealedSecrets = {
    v: 1,
    iter: PBKDF2_ITER,
    salt: b64encode(salt),
    dataKeyHash: b64encode(dataKeyHashBytes),
    wrapped,
    fields,
  };

  return {secrets, photos, ymlAlias, ymlSource};
}

async function sealPath(
  node: unknown,
  parts: string[],
  trail: Array<string | number>,
  fileKey: string,
  lang: string,
  dataKey: CryptoKey,
  fields: Record<string, CipherText>,
): Promise<void> {
  if (parts.length === 0 || node == null) {
    return;
  }
  const head = parts[0];
  const rest = parts.slice(1);
  if (head == null) {
    return;
  }
  if (head === '*') {
    if (!Array.isArray(node)) {
      return;
    }
    for (let i = 0; i < node.length; i++) {
      await sealPath(node[i], rest, [...trail, i], fileKey, lang, dataKey, fields);
    }
    return;
  }
  if (typeof node !== 'object' || Array.isArray(node)) {
    return;
  }
  const obj = node as Record<string, unknown>;
  if (rest.length === 0) {
    const value = obj[head];
    if (typeof value !== 'string' || value.length === 0) {
      return;
    }
    const id = `${fileKey}.${lang}.${[...trail, head].join('.')}`;
    const ct = await aesGcmEncrypt(dataKey, new TextEncoder().encode(value));
    fields[id] = ct;
    obj[head] = `${SEAL_OPEN}${id}${SEAL_CLOSE}`;
    return;
  }
  await sealPath(obj[head], rest, [...trail, head], fileKey, lang, dataKey, fields);
}

export function seal(opts: Options): Plugin {
  let state: BuildState | null = null;
  let strict = false;

  return {
    name: 'seal',
    enforce: 'pre',
    configResolved(config) {
      // `react-router typegen` resolves the Vite config (which fires our
      // `buildStart` indirectly) but never imports the virtual modules — so
      // a missing SEAL_DATA_KEY there must not abort. Only enforce the env
      // var when this is a real production build.
      strict = config.command === 'build' && config.mode === 'production';
    },
    async buildStart() {
      state = await build(opts, strict);
    },
    resolveId(id, importer) {
      if (id === VIRTUAL_SECRETS) {
        return RESOLVED_SECRETS;
      }
      if (id === VIRTUAL_PHOTOS) {
        return RESOLVED_PHOTOS;
      }
      if (state == null || !id.endsWith('.yml')) {
        return null;
      }
      const abs = isAbsolute(id)
        ? id
        : importer != null
          ? resolve(dirname(importer), id)
          : null;
      if (abs == null) {
        return null;
      }
      const alias = state.ymlAlias.get(abs);
      return alias ?? null;
    },
    load(id) {
      if (state == null) {
        return null;
      }
      if (id === RESOLVED_SECRETS) {
        return `export default ${JSON.stringify(state.secrets)};`;
      }
      if (id === RESOLVED_PHOTOS) {
        return `export default ${JSON.stringify(state.photos)};`;
      }
      const cleanId = id.split('?')[0] ?? id;
      return state.ymlSource.get(cleanId) ?? null;
    },
  };
}
