# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website for Manuele, built with Jekyll and deployed to GitHub Pages at https://www.d3strukt0r.dev. Design is "Terminal Aurora" — dev-coded glassmorphism (indigo/pink aurora blobs on near-black, JetBrains Mono / Space Grotesk / Inter, frosted glass cards, custom cursor, EN/DE + dark/light toggles, terminal easter egg).

## Commands

- `bundle install` — install Ruby gems.
- `bundle exec jekyll serve --livereload` — local dev server.
- `bundle exec jekyll build` — static build into `_site/`.
- `bundle lock --add-platform …` — re-lock after Gemfile platform changes.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Devcontainer at `.devcontainer/` (Ruby 3.2 base + Yarn-key refresh — see inline comment in `Dockerfile` for why).

## Architecture — two-tier rendering

The site splits rendering responsibilities so content pages stay fast while the home page gets the full interactive prototype.

### Global shell (every page)

Rendered by Liquid + a small vanilla-JS runtime. No React.

- `_layouts/default.html` — loads Google Fonts, `assets/css/main.css`, `assets/js/ta-shell.js`.
- `_includes/ta-{bg,nav,footer}.html` — background blobs + grid overlay, fixed nav with brand/clock/EN-DE/theme toggles, footer.
- `_includes/head.html` — `<head>` with SEO, favicons, font link (Google Fonts URL lives here — can't be `@import`ed from SCSS because Dart Sass rejects `;` in URLs).
- `assets/js/ta-shell.js` — all client behavior on non-home pages: theme toggle (writes `body.light|.dark` + `localStorage['portfolio:theme']`), language toggle (writes `localStorage['portfolio:lang']`, swaps `[data-en]`/`[data-de]` text, dispatches `ta:lang` CustomEvent), clock, `IntersectionObserver`-based reveal for `[data-reveal]`, custom cursor (hidden on touch via `(hover: hover) and (pointer: fine)`), terminal easter egg on `~`/`` ` ``/typing `sudo` with commands: help, whoami, skills, experience, contact, github, linkedin, anime, matrix, sudo, clear, exit.

### Home page only (`index.html` → `_layouts/home.html`)

Loads React 18 + Babel-standalone from unpkg (integrity-pinned) and mounts the design's portfolio sections into `#ta-root`.

- `assets/js/portfolio/content.js` — bilingual content blob on `window.PORTFOLIO_CONTENT`.
- `assets/js/portfolio/hooks.jsx` — `useLang` (listens for shell's `ta:lang` event to stay in sync), `useTheme`, `useGitHubRepos`/`useGitHubUser` (cached in `sessionStorage`, unauthenticated `api.github.com`), `useContribGraph`, `Reveal`.
- `assets/js/portfolio/terminal.jsx` — section components (`TAHero`, `TAStats`, `TAAbout`, `TASkills`, `TAGitHub`, `TAProjects`, `TAExperience`, `TAMeta`, `TAContact`). **The `TANav`, `TAFooter`, `TABg`, `CustomCursor`, `Terminal` components in this file are dead code** — the shell provides them; `TerminalAurora` does not render them. Keep them defined for reference but don't wire them back in.
- `_layouts/home.html` injects `site.posts` into `PORTFOLIO_CONTENT.blog` via Liquid before the JSX mounts, so the writing card shows real posts.

### Content pages

- `_layouts/page.html` — wraps Markdown in `.ta-glass.ta-about-main.ta-content` card. Used by `about.md`, `archive.md`, `404.html`.
- `_layouts/post.html` — terminal-styled post with filename/date/read-time header, glass body, prev/next.
- **Markdown tables inside HTML blocks don't render** (kramdown skips Markdown in `<article>` without `markdown="1"`). On `about.md` the Qualifications section is hand-authored HTML using design classes (`.ta-meta-grid`, `.ta-lang-row`, `.ta-cert-row`, `.ta-side-skillrow`) — don't convert back to tables.

### Styles

- `_sass/_terminal.scss` — verbatim design CSS, namespaced under `.ta`.
- `_sass/_terminal-content.scss` — Markdown-in-glass rules (headings, tables, code, etc.) + reveal animation + easter-egg modal styles + post/archive/404 helpers.
- `assets/css/main.scss` — Jekyll SCSS entry: `@use "terminal"; @use "terminal-content";`. **Must not be named `terminal.scss`** — a sibling `.scss` with the same name as an `@use`/`@import` target causes a self-import cycle (`expected "{"` error).

## Collections & content

- `_posts/` — blog posts.
- `_steps/` — CV timeline entries (`output: false`). Consumed by `about.md` which renders them as `.ta-exp-row` rows, sorted reverse-chronologically.
- `assets/` — static assets; files under `assets/img` get `image: true` front matter defaulted in.
- `.well-known/` — served as-is.
- Root pages: `index.html`, `about.md`, `archive.md`, `atom.xml`, `404.html`.

Plugins: `jekyll-feed`, `jekyll-gist`, `jekyll-seo-tag`, `jekyll-sitemap`. `jekyll-paginate` was removed when home stopped being a paginated blog.

Site metadata (`title`, `url`, `author`, `nav`) in `_config.yml`. Jekyll does **not** hot-reload `_config.yml` — restart the server after changes.

## Deployment

GitHub Pages builds the site itself — `.github/workflows/` only contain repo-hygiene automation (Dependabot, labels, stale, greetings), no build/deploy workflow. Custom domain in `CNAME.tmp`.
