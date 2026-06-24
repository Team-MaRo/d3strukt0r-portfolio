/// <reference types="vite-plugin-svgr/client" />

// Module declarations for Vite's build-time query suffixes used in this app.

// `.yml`/`.yaml` imports resolve to the parsed document (see app/vite/plugins/yaml.ts).
// Typed loosely (`any` values) so consumers can assert the concrete shape with a
// single `as` — e.g. linkedin.ts imports YAML sequences and casts them to typed
// arrays. Matches the type the former @modyfi/vite-plugin-yaml shipped.
declare module '*.yml' {
  const value: Record<string, any>;
  export default value;
}

declare module '*.yaml' {
  const value: Record<string, any>;
  export default value;
}

declare module '*.md?parsed' {
  interface ParsedMd {
    frontmatter: Record<string, unknown>;
    content: string;
    html: string;
  }
  const value: ParsedMd;
  export default value;
}
