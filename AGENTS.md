# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Personal website for Manuele at https://d3strukt0r.dev. React app on **React Router v7** (the Remix successor). Shipped two ways from one codebase:

1. **GitHub Pages** — `SSR=false pnpm run build` produces a static SPA (`build/client/`); `actions/deploy-pages` publishes it. Default production deploy.
2. **Docker image** on `docker.io/d3strukt0r/d3strukt0r.github.io` (Docker Hub) — full SSR via `react-router-serve` on Node, packaged as an **OCI image built by Nix** (no Dockerfile). For self-hosting.

Design is **Terminal Aurora** — dev-coded glassmorphism (indigo/pink aurora blobs on near-black, JetBrains Mono / Space Grotesk / Inter, frosted glass cards, custom cursor, EN/DE + dark/light toggles, terminal easter egg).

## Runtime

- **Node 24** everywhere: `.devcontainer/`, every CI workflow that touches JS, the Nix runtime closure (`pkgs.nodejs-slim_24`), and `engines.node` in `package.json`. Bump all four together if you move off 24.
- **React 19** + **React Router v7** (`react-router`, `@react-router/dev`). Framework mode. `react-router.config.ts` reads `ssr: process.env.SSR !== 'false'` — defaults to **SSR on** (used by the Docker image, which runs `react-router-serve ./build/server/index.js`); the GitHub Pages workflow sets `SSR=false` to force SPA output.

## Commands

- `pnpm install` — deps (run `corepack enable` first if pnpm isn't available).
- `pnpm run dev` — Vite dev server (5173) with HMR.
- `pnpm run build` — production build + postbuild static artifact generation → `build/client/`.
- `pnpm run typecheck` — `react-router typegen && tsc --noEmit`.
- `pnpm run lint` / `pnpm run lint:fix` — ESLint via `@iwf-web/eslint-coding-standard` (flat config in `eslint.config.js`).
- `pnpm run preview` — serve `build/client/` on 4173.
- `pnpm run sync:linkedin:csv` — import LinkedIn "Download your data" CSVs from `data/linkedin/` into `content/linkedin/*.yml`.
- `pnpm run sync:linkedin:api` — same destination, but fetched live via the Member Data Portability API using `LINKEDIN_DMA_TOKEN` from `.env` (see `docs/linkedin-data-portability.md`).
- `docker compose up dev` — Nix dev shell in a container; runs `pnpm run dev --host 0.0.0.0` on `http://localhost:5173` with the source bind-mounted. No Dockerfile build step needed.
- `nix build --impure .#dockerImage` — produce the production OCI image as a tarball at `./result`. `docker load < result` to import. See "Production image" below.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Architecture

### Stack

- **Vite 8** with `vite-tsconfig-paths` (the `~/` alias maps to `app/`). Sass configured with `api: "modern-compiler"` in `vite.config.ts`.
- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** (SCSS syntax) for structural CSS. See the Styling section.
- **react-i18next** + `i18next-browser-languagedetector`. Translations in `app/locales/{en,de}.yml` (imported as modules via `@modyfi/vite-plugin-yaml`); detected from `localStorage['d3strukt0rs-portfolio:lang']` → navigator. `t()` returns strings; pass `{ returnObjects: true }` for arrays.
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

- `useTheme` — dark/light, persist to `localStorage['d3strukt0rs-portfolio:theme']`, toggle `body.light|.dark`.
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
  - `unlock(pw)` → tries the password against each wrapped key, decrypts every field + photo on success, caches plaintext + photo `Blob` object URLs in module state, and persists the raw data key in `sessionStorage['d3strukt0rs-portfolio:seal:dataKey']` so navigations within the tab stay unlocked. Returns `'ok' | 'wrong' | 'cooldown'`.
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
- `app/vite/plugins/static-artifacts.ts` → `404.html` (copy of `index.html` — used by the GitHub Pages SPA build for client-side routing on cold loads; the Node SSR image doesn't need it) + `atom.xml` (up to 20 most recent posts).
- `app/vite/plugins/md-frontmatter.ts` → parses `*.md?parsed` imports at build time so `gray-matter` / `marked` / `js-yaml` stay out of the client bundle.
- `app/vite/plugins/posts.ts` → shared post loader reused by the sitemap `dynamicRoutes` and the atom feed.
- `app/vite/plugins/seal.ts` → encrypts sensitive linkedin yml fields + image assets at build time and exposes them via `virtual:sealed-secrets` / `virtual:sealed-photos`. See "Sealed content" above.

`public/CNAME` (`d3strukt0r.dev`) is copied verbatim by Vite.

## Production image (Nix-built OCI)

There is **no Dockerfile**. The production image is produced entirely by `flake.nix` via `pkgs.dockerTools.streamLayeredImage`.

- **Build it locally**: `SEAL_DATA_KEY=$(openssl rand -base64 32) nix build --impure .#dockerImage` → `./result` is a docker-load-able tarball. `docker load < result` to import as `d3strukt0r/portfolio:latest` (~250 MB tar / ~530 MB on disk).
- **Two derivations**: `packages.<sys>.d3strukt0rs-portfolio` builds the SSR bundle (`pnpm install --offline` via `pnpm.fetchDeps` FOD, `pnpm run build`, `pnpm prune --prod`, drop `.pnpm/node_modules` mirror, `installPhase` lays the result at `$out/opt/d3strukt0rs-portfolio/`). `packages.<sys>.dockerImage` wraps that bundle with the runtime closure into the OCI image. The final `dockerImage` output is `dockerImageStream` piped through the `fixOciImageHistory` post-processor (see below).
- **Shared utilities (`nix-utils` flake input)**: `inputs.nix-utils.url = "github:d3strukt0r/nix-utils"` (with `nixpkgs.follows = "nixpkgs"` to keep the lock clean). Provides `packages.<sys>.fixOciImageHistory` and `lib.oci.{secondsToNanos, createdFromDate}`. Pure helpers + the post-processor live there so they can be reused across repos without copy-paste.
- **Runtime contents** (in `streamLayeredImage`'s `contents = […]`): `dockerTools.usrBinEnv`, `dockerTools.fakeNss` (with `extraPasswdLines` / `extraGroupLines` appending the nonroot user), `bashInteractive` + `coreutils` + `gnused` + `which` (needed by pnpm's `node_modules/.bin/*` shell shims that `dirname`/`sed` their `$0`), `nodejs-slim_24` (no npm, no corepack, no headers — saves ~30 MB vs `nodejs_24`), a `curlSlim` (`pkgs.curl.override` with `scpSupport`/`gssSupport`/`pslSupport`/`brotliSupport`/`zstdSupport`/`ldapSupport`/`rtmpSupport`/`http3Support`/`websocketSupport` all off — drops krb5, libssh2, libpsl, brotli, zstd), and the `d3strukt0rs-portfolio` derivation itself. `bashInteractive` rather than plain `bash` because nodejs-slim_24 transitively pulls bash-interactive into the closure already; adding plain bash on top would ship two shells.
- **Filesystem layout**: the `d3strukt0rs-portfolio` derivation's `installPhase` writes `$out/opt/d3strukt0rs-portfolio/{build,node_modules,package.json}`. Including the derivation in `streamLayeredImage.contents` puts the app straight at `/opt/d3strukt0rs-portfolio/*` in the image — dockerTools deep-merges directories (mirror dirs with symlinks at the leaves), no `extraCommands` symlink dance. Costs ~3 MB tar / ~12 MB on-disk vs. hand-rolled symlinks; accepted for the cleaner flake.
- **User**: runs as `nonroot:65532` (distroless convention). Files in `/opt/d3strukt0rs-portfolio/` are owned by `root:root` 755 — nonroot has read-only access; only `/tmp` (mode 1777, FHS) is writable, created in `extraCommands`. `/etc/passwd` + `/etc/group` + `/etc/nsswitch.conf` come from `dockerTools.fakeNss.override { extraPasswdLines = [...]; extraGroupLines = [...]; }`. fakeNss's transitive deps (bash-interactive, ncurses, readline, sqlite) are already in the closure via nodejs-slim_24's wrappers, so it costs ~0 extra bytes vs. the inline `/etc/*` approach we used to use.
- **Healthcheck**: `curl -fsS http://localhost:3000/`. CMD is `react-router-serve ./build/server/index.js`, found via `PATH=/opt/d3strukt0rs-portfolio/node_modules/.bin:/bin:/usr/bin`. Durations are written `Interval = secondsToNanos 30` etc. — the OCI spec stores them as int64 nanoseconds, and `lib.oci.secondsToNanos` (from `nix-utils`) keeps the source readable.
- **Reproducibility**: `created = createdFromDate self.lastModifiedDate;` (helper from `nix-utils.lib.oci`). On a clean git tree `lastModifiedDate` is the HEAD commit time, so identical sources produce an identical config-blob digest. Default would be epoch 0 (shows up as "56 years ago"); `"now"` would change every build.
- **Required env at runtime**: `SEAL_DATA_KEY` (must match the build-time value — different keys produce different bundles) + `REVEAL_PASSWORDS` (comma-separated unlock passphrases for the seal system).
- **Hardening tricks worth knowing**:
  - `dontFixup`/`dontStrip`/`dontPatchShebangs`/`dontPatchELF = true` on the `d3strukt0rs-portfolio` derivation. Without them, `patchShebangs` rewrites every `#!/usr/bin/env node` in `node_modules` to `/nix/store/<hash>-nodejs-24…`, dragging the full nodejs (with npm/headers), stdenv, perl, python, gcc-libs into the runtime closure. The unmodified `/usr/bin/env <prog>` shebangs work because we ship `dockerTools.usrBinEnv` + `nodejs-slim_24` + `bashInteractive` + `coreutils` + `gnused`.
  - `disallowedReferences = [ pkgs.nodejs_24 ]` — hard-fails the build if the full nodejs sneaks back in.
  - `enableFakechroot = true` — runs `extraCommands` inside a fakechroot so paths like `mkdir -p tmp` resolve relative to the image root rather than the host.
  - **`fixOciImageHistory`** (Python post-processor sourced from the `nix-utils` flake input — see https://github.com/d3strukt0r/nix-utils): `streamLayeredImage` records each layer's store path in `history[].comment` but leaves `history[].created_by` empty, which makes Dive / Docker Desktop's per-layer Command column blank. The post-processor copies `comment → created_by` and adds a synthetic `HEALTHCHECK CMD …` history entry derived from `config.Healthcheck` — Trivy's `DS-0026` rule reads `created_by` instead of `Config.Healthcheck` and fires a false positive otherwise. Recomputes the config-blob digest + rewrites `manifest.json`. Wired in as `dockerImage = pkgs.runCommand "…-image.tar" { } '' ${dockerImageStream} | ${fixHistoryScript} > $out ''`.
- **`compose.yml`** is now **dev-only**: launches `nixos/nix:2.34.6`, runs `nix develop --command sh -c "pnpm install && pnpm run dev --host 0.0.0.0"` on `5173`. Source is bind-mounted; `node_modules/` and `/nix` are named volumes for persistence between restarts.
- **`pnpmDeps.hash`** in `flake.nix` is a fixed-output derivation hash. It must match the SHA-256 of the tarball pnpm fetches from `pnpm-lock.yaml`. **Every lockfile change → new hash.** First build with a stale hash fails with `specified: X / got: Y` — copy the `got` value into `flake.nix`. Auto-bumped on Dependabot npm PRs by `bump-pnpm-hash.yml` (see Workflows).

## Workflows

- `.github/workflows/ci.yml` — two parallel jobs:
  - **`checks`**: lint + typecheck + build (pnpm). All steps `continue-on-error: true` so a single failure doesn't hide the others; a trailing aggregator step turns the per-step outcomes into a markdown summary table and re-derives the real exit code. CI build receives a placeholder `SEAL_DATA_KEY` (32 zero bytes, base64) so the seal plugin's strict check passes — the bundle is a smoke test, never shipped.
  - **`trivy`**: builds the Nix OCI image (`nix build --impure .#dockerImage` → `docker load`) and runs four scans against `d3strukt0r/portfolio:latest`: vulnerability (HIGH/CRITICAL only), secret, misconfig, and CIS Docker compliance. Same `continue-on-error` + aggregator pattern.
- `.github/workflows/deploy-gh-pages.yml` — `pnpm install --frozen-lockfile` → `SSR=false pnpm run build` → `actions/upload-pages-artifact@v5 { path: build/client }` → `actions/deploy-pages@v5`. Triggered on push to `master` or manual dispatch. Build receives `SEAL_DATA_KEY` + `REVEAL_PASSWORDS` from repo secrets (rotate by editing the secret and redeploying). **One-time repo setup**: Settings → Pages → Source = **GitHub Actions** (otherwise the legacy `jekyll-build-pages` action runs and publishes broken output).
- `.github/workflows/docker.yml` — build + push multi-arch (`linux/amd64` on `ubuntu-24.04`, `linux/arm64` on `ubuntu-24.04-arm`, `linux/riscv64` on `ubuntu-24.04` via `docker/setup-qemu-action` + `extra-platforms = riscv64-linux` in `/etc/nix/nix.conf`) Nix-built OCI image to **Docker Hub** on push to `master`/`develop` and `*.*.*` tags. Two-job pipeline with strict credential separation:
  - **`build` matrix** (per-arch, parallel): `nix build --impure .#dockerImage` → captures the streaming script's stdout to `./image.tar` (docker-archive) → `nix run nixpkgs#syft -- docker-archive:image.tar -o spdx-json=sbom.json` → uploads `{image.tar, sbom.json}` as artifact `image-<arch>` (1-day retention). **No Docker Hub credentials** are exposed to matrix runners — they don't push, sign, or attest. Labels still come from `metadata-action`'s `labels` output, JSON-encoded and exported as `DOCKER_LABELS_JSON` for `flake.nix` to read via `builtins.getEnv`; the `tags` output is unused here.
  - **`manifest` job** (single runner with `registry:3` as a service container on `localhost:5000`): buildkit is told `[registry."localhost:5000"] http = true` via `setup-buildx-action`'s `buildkitd-config-inline` (the host docker daemon's `insecure-registries` is **never** touched — restarting `docker` would kill the service container). For each arch: `skopeo copy --dest-tls-verify=false docker-archive:image.tar docker://localhost:5000/staging:<arch>` → `skopeo inspect` captures the digest. Then a single `docker buildx imagetools create --annotation … -t <user-tag1> -t <user-tag2> … "localhost:5000/staging@<amd64-digest>" "…@<arm64-digest>" "…@<riscv64-digest>"` → buildkit pulls bytes from localhost and pushes to docker.io. **The per-arch images land on docker.io untagged**, reachable only by digest via the manifest list's references; the only tags in the public Docker Hub tag listing are the user-facing ones from `metadata-action` (`latest`, `<branch>`, `<semver>`, `<major>.<minor>`). Annotations come from `metadata-action`'s `annotations` output (`manifest:org.opencontainers.image.*`).
  - **Per-arch attestations** (all in the manifest job, keyed by docker.io digest): `cosign sign <repo>@<digest>` × 3, `cosign attest --predicate sbom.json --type spdxjson` × 3 (the SBOM JSON travels inside each per-arch artifact bundle), `actions/attest@v4 push-to-registry: true` × 3 (auto-detects SLSA provenance mode when no `sbom-path` / custom `predicate` is supplied — same output as the now-thin `actions/attest-build-provenance` wrapper). Then `cosign sign` the manifest-list digest once. **Provenance fidelity caveat**: the action runs in the manifest job, so the predicate's recorded build-step list reflects the manifest job's steps rather than the matrix legs' — every SLSA-mandated field (commit SHA, workflow ref, builder OIDC identity) is identical, so this is a documentation issue, not a verification issue.
  - **Failure-mode property**: `manifest` is gated on `needs: build` succeeding for all three matrix legs. If any leg fails its build, syft, or artifact upload, the manifest job never runs and **nothing** leaks to Docker Hub — there is no partial-success state to clean up (replaces the "push-then-delete-per-arch-tags" approach we briefly tried).
  - Requires repo secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` (PAT scoped Read & Write at hub.docker.com → Account settings → Security) + `SEAL_DATA_KEY`. The build matrix legs only need `SEAL_DATA_KEY`; `DOCKERHUB_*` is required only by the `manifest` job.
- `.github/workflows/bump-pnpm-hash.yml` — auto-bumps `pnpmDeps.hash` in `flake.nix` whenever Dependabot opens an npm PR. Triggered by `pull_request_target` on `pnpm-lock.yaml` / `package.json` changes; gated on `github.actor == 'dependabot[bot]'`. Replaces the hash with `lib.fakeHash`, runs `nix build` to provoke the mismatch error, extracts the `got: sha256-…` value, patches `flake.nix`, commits, and pushes back to the PR branch. **Requires repo secret `HASH_BUMPER_TOKEN`** — a fine-grained PAT (Contents + Pull requests = R/W) or a GitHub App token. Plain `GITHUB_TOKEN` would push fine but commits authored by it don't trigger downstream workflows, leaving CI stuck. The PAT/App token does.
- `.github/workflows/dependabot-validate.yml` / `dependabot-automerge.yml` / `dockerhub-description.yml` / `greetings.yml` / `label.yml` / `stale.yml` — peripheral automation, unchanged from the JS-only era.

## Devcontainer

`.devcontainer/devcontainer.json` — `mcr.microsoft.com/devcontainers/base:debian` + features: `common-utils`, `node:1` (v24), `docker-outside-of-docker`, `github-cli`, `devcontainers-extra/features/act` (so you can run `act` against the workflows locally). Forwards 5173 (Vite dev), 4173 (preview), 3000 (Node SSR — serves the production build via `react-router-serve`). `postCreateCommand: corepack enable && pnpm install`. Note: Nix is **not** installed in the devcontainer by default — for image builds, run `nix build` inside `nixos/nix:2.34.6` (e.g. via `compose.yml`'s pattern) or install Nix into the devcontainer ad-hoc.

## Gotchas

- **Hash routing is *not* used** — on GitHub Pages the SPA fallback trick (`404.html = index.html`) lets every URL serve the bundle and the client router takes over; on the Node SSR image, `react-router-serve` resolves routes server-side. If you need hash routing later, swap out the app-level router instead of the fallback.
- **React Router framework types** — run `pnpm run typecheck` (which triggers `react-router typegen`) before manually editing `.react-router/types/**`. Route modules import from `./+types/<route>`.
- **i18n arrays** — `t('hero.now', { returnObjects: true })`. Without the option you get the key back as a string.
- **Node version bump** — touch all four spots in lockstep: `package.json:engines.node`, `flake.nix` (`pkgs.nodejs-slim_24` and `pkgs.pnpm_10.configHook`/`pkgs.pnpm_10.fetchDeps` references — bumping nixpkgs to a channel that ships Node 26 is the easier path), every CI workflow that calls `actions/setup-node` (`ci.yml`, `deploy-gh-pages.yml`), and `.devcontainer/devcontainer.json`'s `node:1` feature `version`.
- **`pnpmDeps.hash`** — every change to `pnpm-lock.yaml` requires a paired hash bump in `flake.nix`. Dependabot npm PRs are auto-handled by `bump-pnpm-hash.yml`; manual `pnpm add`/`pnpm update` requires running `nix build --impure .#d3strukt0rs-portfolio` and pasting the `got: sha256-…` value back, OR `nix run nixpkgs#nix-update -- --flake --version=skip d3strukt0rs-portfolio`.
- **`--impure` is required for `nix build`** — `flake.nix` reads `SEAL_DATA_KEY` and `DOCKER_LABELS_JSON` from the env via `builtins.getEnv`. Without `--impure`, both come back as `""` (empty string) and the build silently produces a broken bundle (no seal key, no labels).
- **`d3strukt0rs-portfolio` is in `streamLayeredImage.contents`** — only because its `installPhase` writes everything under `$out/opt/d3strukt0rs-portfolio/`. dockerTools symlinks every top-level path of each contents-package into rootfs, so a derivation whose `$out` has `build` / `node_modules` / `package.json` at the root would put those at `/`. The `installPhase` nesting under `opt/d3strukt0rs-portfolio/` is what makes contents-inclusion safe — don't move files back to `$out/` root.
- **`fixOciImageHistory` lives in `nix-utils`** — if Trivy starts flagging DS-0026 again, the layer / healthcheck synthesis logic is in `github:d3strukt0r/nix-utils` (`packages.<sys>.fixOciImageHistory`), not this repo. Local edits via `inputs.nix-utils.url = "path:/abs/path/nix-utils"` for iteration; `nix flake update nix-utils` to re-pin against the upstream commit. The script recomputes `sha256(config_json)` and rewrites `manifest.json` — if you change healthcheck or config schema, verify with `docker load < result`.
- **`docker.yml` manifest job's `registry:3` service container** — used as a write-only staging area so per-arch image bytes can be ferried by digest into `imagetools create` without ever being tagged on docker.io. **Do not** add `localhost:5000` to the host docker daemon's `/etc/docker/daemon.json` `insecure-registries` and restart docker — that would tear down the service container itself. Buildkit gets the insecure flag via `setup-buildx-action`'s `buildkitd-config-inline: [registry."localhost:5000"]\n http = true`; skopeo gets it via `--dest-tls-verify=false` / `--tls-verify=false`. If you need to add another tool that talks to localhost:5000, give it the equivalent flag rather than mutating the daemon. Conversely, if a step ever fails with `http: server gave HTTP response to HTTPS client`, that's the missing buildkit/skopeo flag.
- **pnpm via Corepack (host / devcontainer / CI only)** — the `packageManager` field in `package.json` pins the version for tooling that respects it. Run `corepack enable` once on your dev machine; don't `npm i -g pnpm`. The production image bypasses Corepack entirely — it uses `pkgs.pnpm_10` from nixpkgs at build time, and ships zero pnpm at runtime (only `react-router-serve` + node).
- **Nav anchor jumps + `scroll-margin-top`** — `TaNav` hash links (`/#about`, `/#stack`, `/#work`, `/#contact`) run through `smoothScrollToAnchor`. `html { scroll-padding-top: 80px }` (in `_base.scss`) clears the fixed nav; `.ta-section` has `scroll-margin-top: -64px` to cancel its own 80px top padding so section-anchor jumps land at the heading, not 80px above it. If you add a new section type that should be a nav target, give it the same `scroll-margin-top` or the anchor will overshoot.
- **Cross-route hash scroll** — `app/root.tsx` watches `loc.hash`; when it changes (including after a cross-route navigation like `/cv` → `/#about`), it calls `smoothScrollToAnchor` on the next frame. Don't also add per-route hash handlers — they race.
- **`position: fixed` inside `backdrop-filter` ancestors** — `TaNav` (and any `.ta-glass`) uses `backdrop-filter`, which creates a new containing block. Children with `position: fixed` will anchor to that ancestor instead of the viewport. `LockModal` works around this by `createPortal`-ing to `document.body`. Apply the same pattern for any new modal / floating overlay rendered from inside a glass surface.
- **No emoji icons** — emoji glyphs (🔒, 🔓, ↗) render inconsistently across platforms (especially Windows, where the system emoji font for U+1F512 is colored and oversized). Use inline SVG (`app/components/icons/*.tsx`, `currentColor` strokes) instead. The `↗` arrow in `CertLink` is the one tolerated exception because it's a BMP geometric shape, not an emoji.
