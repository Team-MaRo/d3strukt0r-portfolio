import {CORE_SCHEMA, load} from 'js-yaml';

// Minimal `gray-matter` replacement returning the two fields we use: the parsed
// leading `---` YAML frontmatter (`data`) and the body after it (`content`).
//
// Why not gray-matter: it pins the js-yaml 3.x API (safeLoad/safeDump), so its
// transitive js-yaml can't move off 3.x — which carries an unpatchable merge-key
// DoS (GHSA-h67p-54hq-rp68; fixed only in js-yaml >=4.2.0). Parsing frontmatter
// ourselves with the js-yaml 5 we already depend on drops that dependency.
//
// Schema: CORE_SCHEMA (YAML 1.2), so `date: 2026-04-23` stays a string. The post
// pipeline already normalises dates via parseDate/`new Date(...)`, which accept
// either a string or a Date, so this matches existing behaviour.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;

export function matter(raw: string): {data: Record<string, unknown>; content: string} {
  // Strip a leading UTF-8 BOM, like gray-matter (via strip-bom-string).
  const input = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const match = FRONTMATTER_RE.exec(input);
  if (!match) {
    return {data: {}, content: input};
  }
  const block = match[1] ?? '';
  // js-yaml 5's `load` throws on empty input; an empty block has no data.
  const parsed = block.trim() === '' ? null : load(block, {schema: CORE_SCHEMA});
  const data
    = parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return {data, content: input.slice(match[0].length)};
}
