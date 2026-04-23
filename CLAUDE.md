# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **Vite 5** with `vite-tsconfig-paths` (the `~/` alias maps to `app/`). Sass configured with `api: "modern-compiler"` in `vite.config.ts`.
- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** (SCSS syntax) for structural CSS. See the Styling section.
- **react-i18next** + `i18next-browser-languagedetector`. Translations in `app/locales/{en,de}.yml` (imported as modules via `@modyfi/vite-plugin-yaml`); detected from `localStorage['portfolio:lang']` → navigator. `t()` returns strings; pass `{ returnObjects: true }` for arrays.
- **marked** + **gray-matter** for Markdown content (blog posts).

### Entry points & layout

- `app/root.tsx` — `<Layout>` emit `<html>`/`<head>` + `Scripts`. The default export mounts the global shell: `TaBg`, `CustomCursor`, `TaNav`, `<Outlet />`, `TaFooter`, `TaTerminal`. Also runs `useTheme()` + `useReveal()` once so theme class + scroll-reveal work on every route.
- `app/routes.ts` — `_index` (home), `cv`, `blog`, `blog/:slug`, `*` (not-found catch-all).

### Components (`app/components/`)

- `TaNav`, `TaFooter`, `TaBg` — shell chrome.
- `TaTerminal` — easter-egg overlay (listens globally for `~`, `` ` ``, and typing `sudo`). Commands: `help`, `whoami`, `skills`, `experience`, `contact`, `github`, `linkedin`, `anime`, `matrix`, `sudo`, `clear`, `exit`.
- `CustomCursor` — animated dot + ring on `(hover: hover) and (pointer: fine)` devices only.

### Hooks (`app/hooks/`)

- `useTheme` — dark/light, persist to `localStorage['portfolio:theme']`, toggle `body.light|.dark`.
- `useReveal` — one `IntersectionObserver` observing every `[data-reveal]` element; a paired `MutationObserver` picks up new ones (so per-route elements get animated after navigation).
- `useGithub` — `useGithubUser`, `useGithubRepos`, `useContribGraph`. Unauthenticated `api.github.com`; cached in `sessionStorage`. Fallback on the home page uses `PROJECTS_FALLBACK` from `data.ts`.

### Content (`content/`)

- `content/posts/*.md` — blog posts with `title`/`date` frontmatter, slug derived from filename by stripping leading `YYYY-MM-DD-`. Support `{{ … }}` template tokens (see below).
- `content/site.yml` — central variables referenced from posts as `{{ path.to.key }}` (e.g. `{{ repo }}`, `{{ author.email }}`). Expanded at build time. Route URLs are derived from `app/routes.ts` and exposed as `{{ urls.<route-file-basename> }}` (e.g. `{{ urls.blog }}`, `{{ urls.cv }}`) — don't duplicate them in site.yml. Built-in specials: `{{ toc }}` (auto bullet-list of h2–h6 in the doc), `{{ now }}` (build-date string), `{{ gist:ID }}` (→ pibb iframe embed). Footnotes use GFM syntax (`[^id]` / `[^id]: body`) via `marked-footnote`. Fenced code blocks are highlighted at build time by `shiki` with dual light/dark themes (github-light-default / github-dark-default) — tokens carry both colors as CSS variables and the site's `.ta.light` / `.ta.dark` class flips between them. An opt-in `linenos` flag on the info string (e.g. ` ```js linenos `) adds a two-column layout with a line-number gutter.
- `content/linkedin/*.de.yml` — generated from the LinkedIn export / MDP API (see `bin/linkedin/`). Canonical shape defined in `bin/linkedin/schema.ts`. LinkedIn exports in the account's UI language, which is German for this account, so these files are always DE. Hand-edits between syncs are preserved for optional keys only (e.g. `titleEn`, `titleDe`, `stack`, `flag`, `nameEn`).
- `content/linkedin/*.en.yml` — English translations. Produced by the `/translate-linkedin` skill (see `.claude/skills/translate-linkedin/SKILL.md`); at runtime the EN values override the DE source per field, with per-field fallback to DE when EN is missing.
- `Profile.csv` is gitignored — contains lastname + home address; `bin/linkedin/normalize.ts:normalizeProfile` explicitly drops those columns when generating `profile.de.yml`.

`app/lib/content.ts` loads posts at build time via `import.meta.glob(..., { query: "?parsed", eager: true })` (parsed by `app/vite/plugins/md-frontmatter.ts`). The CV timeline (`/cv`) and home "career" section both render the LinkedIn-derived `EXPERIENCE` array from `app/lib/linkedin.ts` — no separate step files.

`app/lib/linkedin.ts` imports the YAMLs directly (parsed at build time by `@modyfi/vite-plugin-yaml`, so `js-yaml` stays out of the client bundle) and exposes typed arrays + derived views (`EXPERIENCE`, `CERTIFICATES`, `LANGUAGES`) consumed by home/cv/terminal.

`app/lib/data.ts` re-exports the LinkedIn-sourced lists plus hand-authored items (stats, socials, skill groups, tech-stack bars). UI strings live in `app/locales/*.yml`.

Sensitive + useless CSVs inside `data/linkedin/` are gitignored (see `.gitignore` and the comments in `docs/linkedin-data-portability.md`). Only the portfolio-relevant CSVs (`Profile.csv`, `Positions.csv`, `Education.csv`, `Certifications.csv`, `Languages.csv`, `Skills.csv`, `Projects.csv`, `Profile Summary.csv`, `Learning.csv`) are tracked.

### Styling

- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** (SCSS braces syntax). Two imports in `app/root.tsx`, in this order:
  1. `./styles/tailwind.css` — Tailwind entry (base + theme + utilities).
  2. `./styles/main.scss` — `@use "terminal"; @use "terminal-content"` — the `.ta-*` design system.
- `app/styles/tailwind.css`:
  - `@import "tailwindcss"`.
  - `@custom-variant dark (&:where(body.dark, body.dark *))` — ties `dark:` to `useTheme`'s `body.dark` / `body.light` toggle, not `prefers-color-scheme`.
  - `@theme inline { … }` — Tailwind tokens (`--color-accent`, `--color-fg-mute`, `--color-line`, `--color-glass`, `--font-sans`/`--font-mono`/`--font-display`, `--container-max`) map onto the runtime CSS custom properties declared on `.ta` / `.ta.light` in `terminal.scss`. Utilities like `bg-accent`, `text-fg-mute`, `border-line` therefore re-theme automatically when the toggle flips.
  - `@utility` blocks — this is where to put reusable class bundles that use `@apply`. Custom class names compose with Tailwind variants (e.g. `hover:ta-accent`).
- `app/styles/terminal.scss` — core design tokens on `.ta` / `.ta.light` plus all `.ta-*` component rules. Uses Sass `&` nesting, `@media` queries, `@keyframes`. Each partial wraps its contents in `@layer components { … }` so Tailwind utilities used directly in JSX still win on cascade.
- `app/styles/terminal-content.scss` — Markdown-in-glass rules (post / page bodies), scroll-reveal animation, easter-egg modal.
- `app/styles/main.scss` — single `@use` entry.

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

`public/CNAME` (`d3strukt0r.dev`) is copied verbatim by Vite.

## Docker image

- `Dockerfile` — multi-stage: `node:24-alpine` build → `nginx:1.27-alpine` runtime.
- `docker/nginx.conf` — SPA fallback via `try_files $uri $uri/ /index.html`, immutable caching for `/assets/`, explicit content-types for `atom.xml` / `sitemap.xml` / `robots.txt`, gzip, sanity headers.
- `compose.yml` — single service, `8080:80`, healthcheck, `restart: unless-stopped`.
- `.dockerignore` — excludes `node_modules`, `build`, CI — but **not** the `docker/` directory; the build context needs `docker/nginx.conf`.

## Workflows

- `.github/workflows/ci.yml` — `lint` + `typecheck` + `build` on every PR / push (pnpm via `pnpm/action-setup@v4`).
- `.github/workflows/pages.yml` — `pnpm install --frozen-lockfile` → `pnpm run build` → `actions/upload-pages-artifact@v3 { path: build/client }` → `actions/deploy-pages@v4`. Trigger on push to `master` or manual dispatch. **One-time repo setup**: Settings → Pages → Source = **GitHub Actions** (otherwise the legacy `jekyll-build-pages` action runs and publishes broken output).
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
