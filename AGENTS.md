# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Personal website for Manuele at https://d3strukt0r.dev. Single-page React app on **React Router v7** (the Remix successor) in SPA mode, with a postbuild step that emits SPA-fallback + SEO artifacts. Shipped two ways:

1. **GitHub Pages** — default production deploy.
2. **Docker image** on `docker.io/d3strukt0r/d3strukt0r.github.io` (Docker Hub) — nginx serving the same static output, for self-hosting.

Design is **Terminal Aurora** — dev-coded glassmorphism (indigo/pink aurora blobs on near-black, JetBrains Mono / Space Grotesk / Inter, frosted glass cards, custom cursor, EN/DE + dark/light toggles, terminal easter egg).

## Runtime

- **Node 24** everywhere: `.devcontainer/`, both CI workflows, the Docker image base, and `engines.node` in `package.json`. Bump all four together if you move off 24.
- **React 19** + **React Router v7** (`react-router`, `@react-router/dev`). Framework mode, `ssr: false` in `react-router.config.ts` → pure SPA, no Node runtime required in production.

## Commands

- `pnpm install` — deps (run `corepack enable` first if pnpm isn't available).
- `pnpm run dev` — Vite dev server (5173) with HMR.
- `pnpm run build` — production build + postbuild static artifact generation → `build/client/`.
- `pnpm run typecheck` — `react-router typegen && tsc --noEmit`.
- `pnpm run lint` / `pnpm run lint:fix` — ESLint via `@iwf-web/eslint-coding-standard` (flat config in `eslint.config.js`).
- `pnpm run preview` — serve `build/client/` on 4173.
- `pnpm run sync:linkedin:csv` — import LinkedIn "Download your data" CSVs from `data/linkedin/` into `content/linkedin/*.yml`.
- `pnpm run sync:linkedin:api` — same destination, but fetched live via the Member Data Portability API using `LINKEDIN_DMA_TOKEN` from `.env` (see `docs/linkedin-data-portability.md`).
- `docker compose up --build` — run the production image locally on `http://localhost:8080`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Architecture

### Stack

- **Vite 8** with `vite-tsconfig-paths` (the `~/` alias maps to `app/`). Sass configured with `api: "modern-compiler"` in `vite.config.ts`.
- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** (SCSS syntax) for structural CSS. See the Styling section.
- **react-i18next** + `i18next-browser-languagedetector`. Translations in `app/locales/{en,de}.yml` (imported as modules via `@modyfi/vite-plugin-yaml`); detected from `localStorage['portfolio:lang']` → navigator. `t()` returns strings; pass `{ returnObjects: true }` for arrays.
- **marked** + **gray-matter** for Markdown content (blog posts).

### Entry points & layout

- `app/root.tsx` — `<Layout>` emit `<html>`/`<head>` + `Scripts`. The default export mounts the global shell: `TaBg`, `CustomCursor`, `TaNav`, `<Outlet />`, `TaFooter`, `TaTerminal`. Also runs `useTheme()` + `useReveal()` once so theme class + scroll-reveal work on every route.
- `app/routes.ts` — `_index` (home), `cv`, `blog`, `blog/:slug`, `*` (not-found catch-all).

### Components (`app/components/`)

- `TaNav`, `TaFooter`, `TaBg` — shell chrome. `TaNav` hosts the `LockButton` in its right cluster (next to lang/theme toggles).
- `TaTerminal` — easter-egg overlay (listens globally for `~`, `` ` ``, and typing `sudo`). Commands: `help`, `whoami`, `skills`, `experience`, `contact`, `github`, `linkedin`, `anime`, `history`, `matrix`, `sudo` (alias `unlock`), `lock`, `clear`, `exit`. `sudo` / `unlock` / `lock` drive the seal system (see "Sealed content" below) — `sudo` switches the input to a real password prompt (inline `[sudo] password for manuele:` label, no echo on submit), submit calls `unlock(pw)` from `~/lib/seal`, result lines printed below. Fully i18n'd — strings live under `terminal.*` in `app/locales/{en,de}.yml`; `skills` / `experience` are derived at render time from `SKILL_GROUPS` (site.yml) + `EXPERIENCE` (LinkedIn). The `experience` command runs `revealAll(...)` so locked rows show `[locked]`. Arrow-Up/Down cycle shell-style through submitted commands (deduped, draft preserved). Passwords are never stored in command history.
- `CustomCursor` — animated dot + ring on `(hover: hover) and (pointer: fine)` devices only.
- `LockButton` (`app/components/LockButton.tsx`) — nav padlock; click toggles between opening `LockModal` (locked) and calling `lock()` (unlocked). Subscribes to seal state for icon swap. Exposes `openLockModal()` from `~/lib/seal-modal` for any component (e.g. `Sealed`, `SealedImage`, `CertLink`) to trigger the modal.
- `LockModal` (`app/components/LockModal.tsx`) — portaled to `document.body` (escapes `TaNav`'s `backdrop-filter` containing block). Live cooldown countdown after 5 wrong passwords (30 s lockout).
- `Sealed`, `SealedImage`, `CertLink` (`app/components/{Sealed,SealedImage,CertLink}.tsx`) — see "Sealed content".
- `LockIcon` (`app/components/icons/LockIcon.tsx`) — inline SVG padlock (locked / open variants), `currentColor`. Always use this — emoji padlocks render inconsistently on Windows.

### Hooks (`app/hooks/`)

- `useTheme` — dark/light, persist to `localStorage['portfolio:theme']`, toggle `body.light|.dark`.
- `useReveal` — one `IntersectionObserver` observing every `[data-reveal]` element; a paired `MutationObserver` picks up new ones (so per-route elements get animated after navigation).
- `useGithub` — `useGithubUser`, `useGithubRepos`, `useContribGraph`. Unauthenticated `api.github.com`; cached in `sessionStorage`. Fallback on the home page uses `PROJECTS_FALLBACK` from `app/lib/site.ts`.
- `useInternalLinkNav` — rAF-driven smooth scroll + SPA-routed `<a href="/…">` hijacking, scoped to a ref. Exports `smoothScrollToAnchor(id)` for direct use (e.g. `TaNav` hash links, the hash-change effect in `root.tsx`). Honors `scroll-padding-top` and the target's `scroll-margin-top`; falls back to an instant jump on `prefers-reduced-motion`.

### Content (`content/`)

- `content/posts/*.md` — blog posts with `title`/`date` frontmatter, slug derived from filename by stripping leading `YYYY-MM-DD-`. Support `{{ … }}` template tokens (see below).
- `content/site.yml` — single source of truth for hand-authored portfolio config. Two consumers:
  1. **Markdown tokens**: posts reference keys via `{{ path.to.key }}` (e.g. `{{ repo }}`, `{{ socials.email }}`). Expanded at build time by `app/vite/plugins/md-frontmatter.ts:loadSiteVars`. Route URLs are derived from `app/routes.ts` and exposed as `{{ urls.<route-file-basename> }}` (e.g. `{{ urls.blog }}`, `{{ urls.cv }}`) — don't duplicate them in site.yml. Built-in specials: `{{ toc }}` (auto bullet-list of h2–h6 in the doc), `{{ now }}` (build-date string), `{{ gist:ID }}` (→ pibb iframe embed). Footnotes use GFM syntax (`[^id]` / `[^id]: body`) via `marked-footnote`. Fenced code blocks are highlighted at build time by `shiki` with dual light/dark themes (github-light-default / github-dark-default) — tokens carry both colors as CSS variables and the site's `.ta.light` / `.ta.dark` class flips between them. An opt-in `linenos` flag on the info string (e.g. ` ```js linenos `) adds a two-column layout with a line-number gutter.
  2. **Typed TS loader** (`app/lib/site.ts`): imports the yml via `@modyfi/vite-plugin-yaml` and re-exports `SOCIALS`, `STATS`, `SKILL_GROUPS`, `DAILY_STACK`, `PROJECTS_FALLBACK`, `QUALIFICATIONS`. If you add a new top-level key for UI data, type it in `site.ts` and re-export.
- `content/linkedin/*.de.yml` — generated from the LinkedIn export / MDP API (see `bin/linkedin/`). Canonical shape defined in `bin/linkedin/schema.ts`. LinkedIn exports in the account's UI language, which is German for this account, so these files are always DE. Hand-edits between syncs are preserved for optional keys only (e.g. `titleEn`, `titleDe`, `stack`, `flag`, `nameEn`).
- `content/linkedin/*.en.yml` — English translations. Produced by the `/translate-linkedin` skill (see `.claude/skills/translate-linkedin/SKILL.md`); at runtime the EN values override the DE source per field, with per-field fallback to DE when EN is missing.
- `content/linkedin/sensitive.yml` — declarative config for the seal system (which fields + photos to encrypt at build time). See "Sealed content" below.
- `Profile.csv` is gitignored — contains lastname + home address; `bin/linkedin/normalize.ts:normalizeProfile` explicitly drops those columns when generating `profile.de.yml`.

`app/lib/content.ts` loads posts at build time via `import.meta.glob(..., { query: "?parsed", eager: true })` (parsed by `app/vite/plugins/md-frontmatter.ts`). The CV timeline (`/cv`) and home "career" section both render the LinkedIn-derived `EXPERIENCE` array from `app/lib/linkedin.ts` — no separate step files.

`app/lib/linkedin.ts` imports the YAMLs directly (parsed at build time by `@modyfi/vite-plugin-yaml`, so `js-yaml` stays out of the client bundle) and exposes typed arrays + derived views (`EXPERIENCE`, `CERTIFICATES`, `LANGUAGES`) consumed by home/cv/terminal.

All non-LinkedIn structured data (`SOCIALS`, `STATS`, `SKILL_GROUPS`, `DAILY_STACK`, `PROJECTS_FALLBACK`, `QUALIFICATIONS`) comes from `app/lib/site.ts`, which is a typed facade over `content/site.yml`. UI strings live in `app/locales/*.yml`. There is no `app/lib/data.ts` — if you see references to it, they're stale.

Sensitive + useless CSVs inside `data/linkedin/` are gitignored (see `.gitignore` and the comments in `docs/linkedin-data-portability.md`). Only the portfolio-relevant CSVs (`Profile.csv`, `Positions.csv`, `Education.csv`, `Certifications.csv`, `Languages.csv`, `Skills.csv`, `Projects.csv`, `Profile Summary.csv`, `Learning.csv`) are tracked.

### Sealed content (password-gated PII)

Some LinkedIn-derived fields (employer names, locations, school names, certificate URLs, profile photo) leak personal info that's fine for *targeted* recipients but not the public web. The `seal` system encrypts them at build time so the deployed bundle ships ciphertext only; visitors enter a passphrase to reveal. The yml files in `content/linkedin/` stay plaintext in the repo — the gate is on the deployed artifact, not the source.

- **Config**: `content/linkedin/sensitive.yml` declares everything to seal. Two top-level keys:
  - `fields: <yml-basename>: [<dotted-path>, ...]` — paths inside `content/linkedin/<basename>.{de,en}.yml` to encrypt. `*` matches any array index. Both DE and EN siblings are processed automatically. Only non-empty strings are sealed.
  - `photos: <id>: <path-from-project-root>` — image assets to encrypt + blurhash. Add a new sealed photo by appending an entry here, then reference it from JSX as `<SealedImage id="<id>" alt="…" />`. Plugin auto-detects mime by extension (`.jpg`/`.jpeg`/`.png`/`.webp`); only JPGs get a real blurhash, others fall back to a generic dark gradient (the encrypted blob still works).

- **Build plugin** (`app/vite/plugins/seal.ts`): reads `REVEAL_PASSWORDS` env (comma-separated), generates one random 256-bit data key per build, wraps it once per password via PBKDF2-SHA256 (600k iter) + AES-GCM, encrypts every matched field + photo with the data key under unique ids (`<file>.<lang>.<dotted.path>` for fields, `photo:<id>` for images). Sealed yml values are replaced in-place with sentinel strings `\0SEAL:<id>\0`. Output exposed via two virtual modules:
  - `virtual:sealed-secrets` → `{salt, iter, wrapped[], fields}` (the `SealedSecrets` type).
  - `virtual:sealed-photos` → `Record<id, {hash, w, h, mime}>`.
  - The plugin redirects linkedin yml imports to a synthetic `\0sealed-yml:<basename>.<lang>` id (no `.yml` suffix) so `@modyfi/vite-plugin-yaml` skips them; the plugin's `load` hook then returns the fully-sealed JSON.
  - Empty `REVEAL_PASSWORDS` → dev fallback password `"dev"` with a console warning.

- **Runtime** (`app/lib/seal.ts`):
  - `unlock(pw)` → tries the password against each wrapped key, decrypts every field + photo on success, caches plaintext + photo `Blob` object URLs in module state, and persists the raw data key in `sessionStorage['portfolio:seal:dataKey']` so navigations within the tab stay unlocked. Returns `'ok' | 'wrong' | 'cooldown'`.
  - `lock()` clears in-memory plaintext, revokes all photo object URLs, and clears the sessionStorage entry.
  - `hydrate()` is called once by `LockButton` mount to re-apply a key cached in sessionStorage.
  - `isSealed(value)`, `sealedId(value)`, `reveal(value, fallback)`, `revealAll(input, fallback)` are the consumer helpers. State is observed via `subscribe(fn)` / `getState()` in a `useSyncExternalStore` pattern.
  - Cooldown: 5 wrong attempts → 30 s lockout. Counter persisted in sessionStorage.

- **Consumer components**:
  - `<Sealed value={maybeSealedString} onLockedClick={openLockModal} />` — passes plaintext through; for sealed strings, renders blurred dots + small lock when locked, real text when unlocked.
  - `<SealedImage id="<id>" alt="…" onLockedClick={openLockModal} />` — required `id` matches a `photos:` key in `sensitive.yml`. Renders a blurhash canvas + centered lock when locked, the decrypted `<img>` when unlocked.
  - `<CertLink url={c.url}>{name}</CertLink>` — name renders as plain text; appends a chip after it when a credential URL exists. `[🔒 Locked]` (dashed pill) when sealed-and-locked, `[↗ Verify]` (solid pill) when unlocked or plaintext. Click on a locked chip opens the unlock modal.

- **Two ways to unlock**: the `LockButton` modal in the nav, or the `sudo` / `unlock` terminal command. Both call the same `unlock()`. `lock` (terminal) and clicking the unlocked padlock both call `lock()`.

- **Threat model**: bundle is public, so a determined attacker can grind PBKDF2 offline. Defense is the passphrase strength — use long (≥ 12 chars) random passphrases per recipient. Rotation = update the `REVEAL_PASSWORDS` GitHub secret and re-deploy; old passwords stop working on the next build because each build generates a fresh data key + fresh wrapped slots.

- **Adding a new sealed item** (no plugin change needed):
  1. *New sealed field* — add the dotted path under `fields.<basename>` in `sensitive.yml`. Wrap the consumer in `<Sealed value={…} />`.
  2. *New sealed photo* — drop the file under `app/assets/`, add `<id>: app/assets/<file>` under `photos:` in `sensitive.yml`, then `<SealedImage id="<id>" alt="…" />` in JSX.

### Styling

- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** (SCSS braces syntax). Two imports in `app/root.tsx`, in this order:
  1. `./styles/tailwind.css` — Tailwind entry (base + theme + utilities).
  2. `./styles/main.scss` — `@use "terminal"; @use "terminal-content"` — the `.ta-*` design system.
- `app/styles/tailwind.css`:
  - `@import "tailwindcss"`.
  - `@custom-variant dark (&:where(body.dark, body.dark *))` — ties `dark:` to `useTheme`'s `body.dark` / `body.light` toggle, not `prefers-color-scheme`.
  - `@theme inline { … }` — Tailwind tokens (`--color-accent`, `--color-fg-mute`, `--color-line`, `--color-glass`, `--font-sans`/`--font-mono`/`--font-display`, `--container-max`) map onto the runtime CSS custom properties declared on `.ta` / `.ta.light` in `terminal.scss`. Utilities like `bg-accent`, `text-fg-mute`, `border-line` therefore re-theme automatically when the toggle flips.
  - `@utility` blocks — this is where to put reusable class bundles that use `@apply`. Custom class names compose with Tailwind variants (e.g. `hover:ta-accent`).
- `app/styles/terminal.scss` + `app/styles/terminal-content.scss` — thin barrel files that `@use` partials under `app/styles/terminal/` and `app/styles/terminal-content/`. Each partial wraps its rules in `@layer components { … }` so Tailwind utilities used directly in JSX still win on cascade.
  - `terminal/_base.scss` — design tokens on `.ta` / `.ta.light`, resets, utility classes, background blobs, glass.
  - `terminal/_nav.scss`, `_hero.scss`, `_layout.scss`, `_blocks.scss`, `_meta.scss`, `_contact-footer.scss` — section-scoped `.ta-*` component rules.
  - `terminal-content/_content.scss` — markdown-in-glass (`.ta-content`) prose + code + gists.
  - `terminal-content/_pages.scss`, `_reveal.scss`, `_terminal-ui.scss`, `_misc.scss` — page-level bits (404, archive, timeline, pagination), scroll-reveal animation, easter-egg overlay, page-specific utilities.
- `app/styles/main.scss` — single `@use "terminal"; @use "terminal-content"` entry.

**No inline `style={{…}}` on JSX.** Either add a class to the appropriate `terminal-content/_misc.scss` or section partial, or use Tailwind utilities. The one allowed escape hatch is setting a CSS custom property inline for a value the server can't know (e.g. `style={{'--ta-bar-w': \`${pct}%\`} as React.CSSProperties}`), with the SCSS rule consuming it via `var(--ta-bar-w)`.

**Stacking quirk.** `terminal/_base.scss` contains `.ta > *:not(.ta-bg, .ta-cursor-ring, .ta-cursor-dot, .ta-term-hint, .ta-term-backdrop, .ta-seal-modal-backdrop) { position: relative; z-index: 1 }`. Any new direct child of `<body class="ta">` that needs `position: fixed` (cursor overlays, floating widgets, modals portaled to body) must be added to that `:not()` exclusion or it will collapse to `position: relative`.

All selectors are namespaced under `.ta`; theme flips via `.ta.light` / `.ta.dark` on `<body>` (`useTheme()` in `app/hooks/useTheme.ts`). The `.ta` block in `terminal.scss` is the source of truth for actual colour values; `@theme inline` in `tailwind.css` just wires Tailwind's naming onto those runtime vars.

**`@apply` inside `.scss` does not expand.** Tailwind's Vite plugin runs on CSS imports but does not re-scan Sass-preprocessed output in this project's plugin order — `@apply` lines pass through to the bundle as unprocessed text and get hoisted out of their selector block. Workarounds for reusable Tailwind class bundles:
1. Put the `@apply` inside an `@utility ta-name { @apply … }` block in `tailwind.css`. Best when you want a named class.
2. Use Tailwind utilities directly in JSX. Best when the composition is one-off.
Don't use bare `@apply` in `.scss` selectors.

### Static artifacts

SEO + SPA-fallback artifacts are emitted by Vite plugins (`vite.config.ts`), no separate postbuild step:

- `vite-plugin-sitemap` → `sitemap.xml` (home, `/cv`, `/blog`, and every blog post URL via `dynamicRoutes`). Scoped to the client environment; `generateRobotsTxt: false` because we use the dedicated robots plugin.
- `vite-plugin-robots-ts` → `robots.txt` (`ALLOW_ALL` + `Sitemap:` hint).
- `app/vite/plugins/static-artifacts.ts` → `404.html` (copy of `index.html` for the SPA fallback on GitHub Pages / nginx `error_page`) + `atom.xml` (up to 20 most recent posts).
- `app/vite/plugins/md-frontmatter.ts` → parses `*.md?parsed` imports at build time so `gray-matter` / `marked` / `js-yaml` stay out of the client bundle.
- `app/vite/plugins/posts.ts` → shared post loader reused by the sitemap `dynamicRoutes` and the atom feed.
- `app/vite/plugins/seal.ts` → encrypts sensitive linkedin yml fields + image assets at build time and exposes them via `virtual:sealed-secrets` / `virtual:sealed-photos`. See "Sealed content" above.

`public/CNAME` (`d3strukt0r.dev`) is copied verbatim by Vite.

## Docker image

- `Dockerfile` — multi-stage: `node:24-alpine` build → `nginx:1.27-alpine` runtime.
- `docker/nginx.conf` — SPA fallback via `try_files $uri $uri/ /index.html`, immutable caching for `/assets/`, explicit content-types for `atom.xml` / `sitemap.xml` / `robots.txt`, gzip, sanity headers.
- `compose.yml` — single service, `8080:80`, healthcheck, `restart: unless-stopped`.
- `.dockerignore` — excludes `node_modules`, `build`, CI — but **not** the `docker/` directory; the build context needs `docker/nginx.conf`.

## Workflows

- `.github/workflows/ci.yml` — `lint` + `typecheck` + `build` on every PR / push (pnpm via `pnpm/action-setup@v4`).
- `.github/workflows/deploy-gh-pages.yml` — `pnpm install --frozen-lockfile` → `pnpm run build` → `actions/upload-pages-artifact@v5 { path: build/client }` → `actions/deploy-pages@v5`. Trigger on push to `master` or manual dispatch. Build step receives `REVEAL_PASSWORDS: ${{ secrets.REVEAL_PASSWORDS }}` (comma-separated passphrases for the seal system — see "Sealed content"; rotate by editing the secret and redeploying). **One-time repo setup**: Settings → Pages → Source = **GitHub Actions** (otherwise the legacy `jekyll-build-pages` action runs and publishes broken output).
- `.github/workflows/docker.yml` — build + push multi-arch (`linux/amd64`, `linux/arm64`) image to **Docker Hub** on push to `master` and `v*.*.*` tags. Requires repo secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` (personal access token, `Read & Write` scope, created at hub.docker.com → Account settings → Security). Tag matrix via `docker/metadata-action` (branch / pr / sha / semver / `latest`), GHA layer cache.

## Devcontainer

`.devcontainer/devcontainer.json` — `mcr.microsoft.com/devcontainers/typescript-node:1-24` with `common-utils`, `docker-outside-of-docker`, `github-cli`, `act` features. Forwards 5173 (Vite dev), 4173 (preview), 8080 (nginx from `compose.yml`). `postCreateCommand: corepack enable && pnpm install`.

## Gotchas

- **Hash routing is *not* used** — the SPA fallback trick (`404.html = index.html`, nginx `try_files`) lets every URL serve the SPA and the client router take over. If you need hash routing later, swap out the app-level router instead of the fallback.
- **React Router framework types** — run `pnpm run typecheck` (which triggers `react-router typegen`) before manually editing `.react-router/types/**`. Route modules import from `./+types/<route>`.
- **i18n arrays** — `t('hero.now', { returnObjects: true })`. Without the option you get the key back as a string.
- **`.dockerignore`** — must not list `docker` (the folder) or `docker/nginx.conf` disappears from the build context and the `COPY` step fails.
- **Node version bump** — touch all four spots in lockstep (`package.json engines`, `Dockerfile`, both workflows, `.devcontainer/devcontainer.json`).
- **pnpm via Corepack** — the `packageManager` field in `package.json` pins the version. Run `corepack enable` once; don't `npm i -g pnpm`. The Dockerfile and devcontainer both call corepack.
- **Nav anchor jumps + `scroll-margin-top`** — `TaNav` hash links (`/#about`, `/#stack`, `/#work`, `/#contact`) run through `smoothScrollToAnchor`. `html { scroll-padding-top: 80px }` (in `_base.scss`) clears the fixed nav; `.ta-section` has `scroll-margin-top: -64px` to cancel its own 80px top padding so section-anchor jumps land at the heading, not 80px above it. If you add a new section type that should be a nav target, give it the same `scroll-margin-top` or the anchor will overshoot.
- **Cross-route hash scroll** — `app/root.tsx` watches `loc.hash`; when it changes (including after a cross-route navigation like `/cv` → `/#about`), it calls `smoothScrollToAnchor` on the next frame. Don't also add per-route hash handlers — they race.
- **`position: fixed` inside `backdrop-filter` ancestors** — `TaNav` (and any `.ta-glass`) uses `backdrop-filter`, which creates a new containing block. Children with `position: fixed` will anchor to that ancestor instead of the viewport. `LockModal` works around this by `createPortal`-ing to `document.body`. Apply the same pattern for any new modal / floating overlay rendered from inside a glass surface.
- **No emoji icons** — emoji glyphs (🔒, 🔓, ↗) render inconsistently across platforms (especially Windows, where the system emoji font for U+1F512 is colored and oversized). Use inline SVG (`app/components/icons/*.tsx`, `currentColor` strokes) instead. The `↗` arrow in `CertLink` is the one tolerated exception because it's a BMP geometric shape, not an emoji.
