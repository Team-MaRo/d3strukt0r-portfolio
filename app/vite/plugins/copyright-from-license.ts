import type {Plugin} from 'vite';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';

interface Options {
  // Explicit path to the LICENSE file, relative to the project root. If
  // omitted, the plugin auto-discovers a license file at the project root by
  // probing the common filenames listed in `DEFAULT_CANDIDATES` below.
  licensePath?: string;
}

// Filenames probed in order when `licensePath` is not provided. Covers the
// conventions used by GitHub's license detection, the GNU project (`COPYING`),
// and the common `LICENSE.txt`/`.md` variants seen in JS ecosystems.
const DEFAULT_CANDIDATES = [
  'LICENSE',
  'LICENSE.txt',
  'LICENSE.md',
  'COPYING',
  'COPYING.txt',
  'COPYING.md',
];

// Parses the copyright line of a LICENSE file and exposes two build-time
// globals so the running app can render a copyright notice without
// duplicating year/holder data outside the legal artefact:
//
//   __COPYRIGHT_YEARS__   e.g. "2020–2026"   ("2026" if single year)
//   __COPYRIGHT_HOLDER__  e.g. "Jane Doe"
//
// The parser accepts any combination of single years and ranges in the LICENSE
// (e.g. `2026`, `2020-2024`, `2020, 2024, 2026`, `2020, 2022-2024, 2026, 2027-2030`)
// and collapses them to a single first–last range for the footer, which is the
// standard footer-copyright form — the comma+range form belongs in the LICENSE
// file, the range form belongs in presentation.
export function copyrightFromLicense(opts: Options = {}): Plugin {
  return {
    name: 'copyright-from-license',
    config() {
      const root = process.cwd();
      const resolved = opts.licensePath !== undefined
        ? join(root, opts.licensePath)
        : DEFAULT_CANDIDATES.map((name) => join(root, name)).find(existsSync);
      if (resolved === undefined) {
        throw new Error(
          `[copyright-from-license] No license file found at project root. Tried: ${DEFAULT_CANDIDATES.join(', ')}. Pass {licensePath} to override.`,
        );
      }
      const raw = readFileSync(resolved, 'utf8');
      const {years, holder} = parseLicense(raw);
      return {
        define: {
          __COPYRIGHT_YEARS__: JSON.stringify(years),
          __COPYRIGHT_HOLDER__: JSON.stringify(holder),
        },
      };
    },
  };
}

const COPYRIGHT_MARKER_RE = /Copyright\s*(?:\(c\)|\(C\)|©)/;
const YEAR_TOKEN_RE = /\d{4}(?:\s*[-–]\s*\d{4})?/g;
const FOUR_DIGIT_RE = /\d{4}/g;

function parseLicense(license: string): {years: string; holder: string} {
  const marker = COPYRIGHT_MARKER_RE.exec(license);
  if (marker === null) {
    return {years: '', holder: ''};
  }
  // Slice everything after the marker up to the end of that line, then trim.
  // Avoids any greedy regex traversal of the whole LICENSE body.
  const tailStart = marker.index + marker[0].length;
  const newline = license.indexOf('\n', tailStart);
  const tail = newline === -1 ? license.slice(tailStart) : license.slice(tailStart, newline);
  const after = tail.trim();
  if (after === '') {
    return {years: '', holder: ''};
  }

  const tokens = [...after.matchAll(YEAR_TOKEN_RE)];
  const last = tokens.at(-1);
  if (last === undefined) {
    return {years: '', holder: after};
  }

  const yearsEnd = (last.index ?? 0) + last[0].length;
  const allYears = Array.from(after.slice(0, yearsEnd).matchAll(FOUR_DIGIT_RE), (m) => Number(m[0]));
  const min = Math.min(...allYears);
  const max = Math.max(...allYears);
  const years = min === max ? String(min) : `${min}–${max}`;
  const holder = after.slice(yearsEnd).trim();
  return {years, holder};
}
