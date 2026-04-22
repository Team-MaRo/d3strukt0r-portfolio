// Module declarations for Vite's build-time query suffixes used in this app.

declare module '*.yml?parsed' {
  const value: unknown;
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
