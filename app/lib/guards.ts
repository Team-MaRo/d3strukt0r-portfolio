export function isNonEmpty(s: string | null | undefined): s is string {
  return s != null && s !== '';
}
