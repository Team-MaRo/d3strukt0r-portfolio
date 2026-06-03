/// <reference types="@modyfi/vite-plugin-yaml/modules" />
/// <reference types="vite-plugin-svgr/client" />

// Module declarations for Vite's build-time query suffixes used in this app.

declare module '*.md?parsed' {
  interface ParsedMd {
    frontmatter: Record<string, unknown>;
    content: string;
    html: string;
  }
  const value: ParsedMd;
  export default value;
}
