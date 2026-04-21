# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website for Manuele at https://www.d3strukt0r.dev. Single-page React app on **React Router v7** (the Remix successor) in SPA mode, with a postbuild step that emits SPA-fallback + SEO artifacts. Shipped two ways:

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
- `docker compose up --build` — run the production image locally on `http://localhost:8080`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Architecture

### Stack

- **Vite 5** with `vite-tsconfig-paths` (the `~/` alias maps to `app/`). Sass configured with `api: "modern-compiler"` in `vite.config.ts`.
- **Sass** — indented `.sass` syntax in `app/styles/*.sass`. *Not* SCSS — renaming to `.scss` will break the parser.
- **react-i18next** + `i18next-browser-languagedetector`. Translations in `app/locales/{en,de}.json`; detected from `localStorage['portfolio:lang']` → navigator. `t()` returns strings; pass `{ returnObjects: true }` for arrays.
- **marked** + **gray-matter** for Markdown content (blog posts + CV steps).

### Entry points & layout

- `app/root.tsx` — `<Layout>` emit `<html>`/`<head>` + `Scripts`. The default export mounts the global shell: `TaBg`, `CustomCursor`, `TaNav`, `<Outlet />`, `TaFooter`, `TaTerminal`. Also runs `useTheme()` + `useReveal()` once so theme class + scroll-reveal work on every route.
- `app/routes.ts` — `_index` (home), `about`, `archive`, `blog/:slug`, `*` (not-found catch-all).

### Components (`app/components/`)

- `TaNav`, `TaFooter`, `TaBg` — shell chrome.
- `TaTerminal` — easter-egg overlay (listens globally for `~`, `` ` ``, and typing `sudo`). Commands: `help`, `whoami`, `skills`, `experience`, `contact`, `github`, `linkedin`, `anime`, `matrix`, `sudo`, `clear`, `exit`.
- `CustomCursor` — animated dot + ring on `(hover: hover) and (pointer: fine)` devices only.

### Hooks (`app/hooks/`)

- `useTheme` — dark/light, persist to `localStorage['portfolio:theme']`, toggle `body.light|.dark`.
- `useReveal` — one `IntersectionObserver` observing every `[data-reveal]` element; a paired `MutationObserver` picks up new ones (so per-route elements get animated after navigation).
- `useGithub` — `useGithubUser`, `useGithubRepos`, `useContribGraph`. Unauthenticated `api.github.com`; cached in `sessionStorage`. Fallback on the home page uses `PROJECTS_FALLBACK` from `data.ts`.

### Content (`content/`)

- `content/posts/*.md` — blog posts with `title`/`date` frontmatter, slug derived from filename by stripping leading `YYYY-MM-DD-`.
- `content/steps/*.md` — CV timeline entries with `title`, `date`, optional `enddate`. Consumed by `/about`.

`app/lib/content.ts` loads them at build time via `import.meta.glob(..., { query: "?raw", eager: true })`, parses with `gray-matter`, renders body with `marked`.

`app/lib/data.ts` holds language-neutral structured data (skill lists, experience entries with EN/DE variants, socials, etc.). UI strings live in `app/locales/*.json`.

### Styling

- `app/styles/main.sass` — entry, `@use "terminal"` + `@use "terminal-content"`.
- `_terminal.sass` — core design tokens (`--bg`, `--accent`, …) and all `.ta-*` component rules.
- `_terminal-content.sass` — Markdown-in-glass rules (post/page bodies), scroll-reveal animation, easter-egg modal.

All selectors are namespaced under `.ta`; theme flips via `.ta.light` / `.ta.dark` on `<body>`.

### Static artifacts

SEO + SPA-fallback artifacts are emitted by Vite plugins (`vite.config.ts`), no separate postbuild step:

- `vite-plugin-sitemap` → `sitemap.xml` (home, `/about`, `/archive`, and every blog post URL via `dynamicRoutes`). Scoped to the client environment; `generateRobotsTxt: false` because we use the dedicated robots plugin.
- `vite-plugin-robots-ts` → `robots.txt` (`ALLOW_ALL` + `Sitemap:` hint).
- `vite/plugins/static-artifacts.ts` → `404.html` (copy of `index.html` for the SPA fallback on GitHub Pages / nginx `error_page`) + `atom.xml` (up to 20 most recent posts).
- `vite/plugins/md-frontmatter.ts` → parses `*.md?parsed` imports at build time so `gray-matter` / `marked` / `js-yaml` stay out of the client bundle.
- `vite/plugins/posts.ts` → shared post loader reused by the sitemap `dynamicRoutes` and the atom feed.

`public/CNAME` (`www.d3strukt0r.dev`) is copied verbatim by Vite.

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
- **`.sass` vs `.scss`** — indented syntax. Do not rename to `.scss`; the files will not parse.
- **React Router framework types** — run `pnpm run typecheck` (which triggers `react-router typegen`) before manually editing `.react-router/types/**`. Route modules import from `./+types/<route>`.
- **i18n arrays** — `t('hero.now', { returnObjects: true })`. Without the option you get the key back as a string.
- **`.dockerignore`** — must not list `docker` (the folder) or `docker/nginx.conf` disappears from the build context and the `COPY` step fails.
- **Node version bump** — touch all four spots in lockstep (`package.json engines`, `Dockerfile`, both workflows, `.devcontainer/devcontainer.json`).
- **pnpm via Corepack** — the `packageManager` field in `package.json` pins the version. Run `corepack enable` once; don't `npm i -g pnpm`. The Dockerfile and devcontainer both call corepack.
