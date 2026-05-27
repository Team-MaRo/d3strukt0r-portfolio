// Shared config for the PWA web app manifest + the favicon rasterizer.
// The Vite plugins `web-manifest.ts` (emits site.webmanifest) and
// `favicon-rasters.ts` (rasterises the source SVG into PNGs) both read
// this so the icon set and manifest stay in lockstep from a single edit.

export interface ManifestIcon {
  size: number;
  out: string;
  purpose?: 'maskable' | 'any' | 'monochrome';
}

export const WEB_MANIFEST_ICONS: ManifestIcon[] = [
  {size: 192, out: 'web-app-manifest-192x192.png', purpose: 'maskable'},
  {size: 512, out: 'web-app-manifest-512x512.png', purpose: 'maskable'},
];

// Install title is the same in both languages (matches the existing
// `apple-mobile-web-app-title` meta in root.tsx) — kept here as a const
// rather than read from i18n locales because there's no localised value
// to source.
export const WEB_MANIFEST = {
  name: 'Manueles Portfolio',
  short_name: 'Manueles Portfolio',
  display: 'standalone',
  // Matches the dark `--bg` token (`app/styles/terminal/_base.scss:13`)
  // since the in-page theme defaults to dark.
  theme_color: '#060614',
  background_color: '#060614',
} as const;
