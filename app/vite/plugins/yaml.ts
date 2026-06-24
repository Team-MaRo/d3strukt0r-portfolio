import type {Plugin} from 'vite';
import {CORE_SCHEMA, load} from 'js-yaml';

// Local replacement for @modyfi/vite-plugin-yaml: imports `.yml`/`.yaml` files
// as ES modules whose default export is the parsed document. The upstream plugin
// hard-imports js-yaml's `DEFAULT_SCHEMA`, removed in js-yaml 5 — a tiny local
// copy lets us depend on js-yaml directly and track its major versions.
//
// Schema: the upstream plugin defaulted to js-yaml 4's `DEFAULT_SCHEMA` (YAML 1.1
// — `yes`/`no` booleans, `!!timestamp` → Date, `<<` merge). We deliberately pin
// js-yaml 5's `CORE_SCHEMA` (YAML 1.2 core) instead. The `.yml` files here are
// plain string/number/bool/null config with none of those 1.1-only constructs,
// and CORE keeps date-like scalars (e.g. `2023-12`) as plain strings — which is
// what the app consumes — rather than coercing them to Date and timezone-shifting
// them on serialisation. (Blog-post frontmatter dates are parsed by gray-matter,
// not this plugin.) The result is plain JSON-serialisable data, so `JSON.stringify`
// suffices to emit the module — no `tosource` dependency needed.
const YAML_RE = /\.ya?ml$/;

export function yaml(): Plugin {
  return {
    name: 'vite:yaml',
    transform(code, id) {
      if (!YAML_RE.test(id)) {
        return null;
      }
      // js-yaml 5's `load` throws on empty input; treat an empty file as null.
      const data = code.trim() === '' ? null : load(code, {schema: CORE_SCHEMA});
      return {
        code: `export default ${JSON.stringify(data)};`,
        map: {mappings: ''},
      };
    },
  };
}
