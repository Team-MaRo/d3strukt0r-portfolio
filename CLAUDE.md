# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website for Manuele, built with Jekyll and deployed to GitHub Pages at https://www.d3strukt0r.dev. Based on the dark-poole theme (https://github.com/andrewhwanpark/dark-poole).

## Commands

- `bundle install` — install Ruby gem dependencies.
- `bundle exec jekyll serve --livereload` — run local dev server with live reload.
- `bundle exec jekyll build` — produce the static site in `_site/`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Architecture

Standard Jekyll layout with one custom collection:

- `_layouts/` — `default.html` wraps every page; `page.html` and `post.html` extend it.
- `_includes/head.html` — shared `<head>`; pulls SEO/feed plugin output.
- `_sass/` — partials imported by `styles.scss` (compiled with `style: :compressed`).
- `_posts/` — blog posts; listed via `/archive` and paginated (1 post/page, see `_config.yml`).
- `_steps/` — **custom collection** for CV/timeline entries (`output: false`, i.e. not rendered as standalone pages — consumed by `about.md` via the timeline styles in `_sass/_timeline.scss`).
- `assets/` — static assets; files under `assets/img` get `image: true` front matter defaulted in.
- `.well-known/` — served as-is (e.g. verification files).
- Root pages: `index.html` (home), `about.md`, `archive.md`, `atom.xml`, `404.html`.

Plugins in use: `jekyll-feed`, `jekyll-gist`, `jekyll-paginate`, `jekyll-seo-tag`, `jekyll-sitemap`.

Site metadata (title, url, author, nav links) lives in `_config.yml` — remember Jekyll does **not** hot-reload `_config.yml`, restart the server after changes.

## Deployment

Deployed via GitHub Pages. The `CNAME.tmp` file is the custom domain placeholder. `.github/workflows/` contains only repo-hygiene automation (Dependabot automerge/validate, labels, stale bot, greetings) — no site build/deploy workflow; Pages builds the site itself.
