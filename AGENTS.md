# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Personal website for Manuele at https://d3strukt0r.dev. **React Router v7** (Remix successor) app shipped two ways from one codebase:

1. **GitHub Pages** — `SSR=false pnpm run build` → static SPA in `build/client/`; `actions/deploy-pages` publishes it. Default production deploy.
2. **Docker Hub image** `d3strukt0r/d3strukt0r.github.io` — SSR via `react-router-serve`, packaged as a **Nix-built OCI image** (no Dockerfile). For self-hosting.

Design is **Terminal Aurora** — glassmorphism (indigo/pink aurora blobs on near-black, JetBrains Mono / Space Grotesk / Inter, frosted glass cards, custom cursor, EN/DE + dark/light toggles, terminal easter egg).

## Runtime

- **Node 24** everywhere: `.devcontainer/`, every CI workflow that touches JS, the Nix runtime closure (`pkgs.nodejs-slim_24`), and `engines.node` in `package.json`. Bump all four together.
- **React 19** + **React Router v7** (framework mode). `react-router.config.ts` reads `ssr: process.env.SSR !== 'false'` — defaults to **SSR on** (Docker image); the Pages workflow sets `SSR=false`.

## Commands

- `pnpm install` (run `corepack enable` first if needed).
- `pnpm run dev` — Vite dev server (5173).
- `pnpm run build` — production build → `build/client/`.
- `pnpm run typecheck` — `react-router typegen && tsc --noEmit`.
- `pnpm run lint` / `pnpm run lint:fix` — ESLint via `@iwf-web/eslint-coding-standard` (flat config).
- `pnpm run sync:linkedin:csv` / `:api` — import LinkedIn data into `content/linkedin/*.yml` (API path needs `LINKEDIN_DMA_TOKEN` in `.env`; see `docs/linkedin-data-portability.md`).
- `docker compose up dev` — Nix dev shell in a container; runs the dev server on 5173 with source bind-mounted.
- `nix build --impure .#dockerImage` — produce the production OCI tarball at `./result`. `docker load < result` to import.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) — `release.yml` (release-please) consumes them.

## Architecture

### Stack

- **Vite 8** with `vite-tsconfig-paths` (`~/` → `app/`). Sass with `api: "modern-compiler"`.
- **Tailwind v4** (`@tailwindcss/vite`) + **Sass** for structural CSS (see Styling).
- **react-i18next** + browser-language detector. Translations in `app/locales/{en,de}.yml` (imported as modules via `@modyfi/vite-plugin-yaml`); `t('key', { returnObjects: true })` for arrays.
- **marked** + **gray-matter** for Markdown blog posts.

### Entry points

- `app/root.tsx` — global shell (`TaBg`, `CustomCursor`, `TaNav`, `<Outlet />`, `TaFooter`, `TaTerminal`); runs `useTheme()` + `useReveal()` once.
- `app/routes.ts` — `_index`, `cv`, `blog`, `blog/:slug`, `*` (404).

### Components (`app/components/`)

- `TaNav` / `TaFooter` / `TaBg` — shell chrome. `TaNav` hosts `LockButton`.
- `TaTerminal` — easter-egg overlay (open via `` ` ``/`~` or typing `sudo`). Commands derive `skills` / `experience` at render time from `SKILL_GROUPS` + `EXPERIENCE`; `sudo`/`unlock`/`lock` drive the seal system; passwords never enter command history. Fully i18n'd under `terminal.*`.
- `LockButton` / `LockModal` — nav padlock + portaled modal (portaled to `document.body` to escape `backdrop-filter` containing block). 5 wrong → 30 s cooldown.
- `Sealed` / `SealedImage` / `CertLink` — see Sealed content.
- `CustomCursor` — dot + ring on `(hover: hover) and (pointer: fine)`.
- `LockIcon` — inline SVG padlock. Always use this — emoji padlocks render inconsistently on Windows.

### Hooks (`app/hooks/`)

- `useTheme` — dark/light → `body.light|.dark` + `localStorage['d3strukt0rs-portfolio:theme']`.
- `useReveal` — one `IntersectionObserver` for `[data-reveal]`; paired `MutationObserver` catches per-route additions.
- `useGithub*` — unauthenticated `api.github.com`, cached in `sessionStorage`. Home falls back to `PROJECTS_FALLBACK`.
- `useInternalLinkNav` — rAF smooth scroll + SPA-routed `<a href="/…">` hijacking. Exports `smoothScrollToAnchor(id)`.

### Content (`content/`)

- `content/posts/*.md` — `title`/`date` frontmatter; slug strips `YYYY-MM-DD-` prefix. Markdown supports `{{ key }}` tokens (expanded by `app/vite/plugins/md-frontmatter.ts:loadSiteVars`), `{{ urls.<route> }}` (auto-derived from `app/routes.ts`), `{{ toc }}`, `{{ now }}`, `{{ gist:ID }}`. GFM footnotes via `marked-footnote`. Fenced code highlighted at build time by `shiki` with dual light/dark themes carried as CSS vars; ` ```js linenos ` opts into the line-number gutter.
- `content/site.yml` — hand-authored portfolio config. Consumed by (1) markdown token expansion, (2) typed TS facade `app/lib/site.ts` which exports `SOCIALS`, `STATS`, `SKILL_GROUPS`, `DAILY_STACK`, `PROJECTS_FALLBACK`, `QUALIFICATIONS`. Add a new key here → type it in `site.ts` and re-export. **There is no `app/lib/data.ts`** — stale references should be removed.
- `content/linkedin/*.de.yml` — generated from LinkedIn export / MDP API (`bin/linkedin/`). Schema in `bin/linkedin/schema.ts`. Always DE (account UI language). Hand-edits preserved for optional keys (`titleEn`, `titleDe`, `stack`, `flag`, `nameEn`).
- `content/linkedin/*.en.yml` — EN overrides produced by `/translate-linkedin` skill; runtime per-field override of DE with fallback.
- `content/linkedin/sensitive.yml` — declarative config for the seal system.
- `Profile.csv` is gitignored (lastname + home address); `bin/linkedin/normalize.ts:normalizeProfile` explicitly drops those columns when generating `profile.de.yml`. Other tracked CSVs under `data/linkedin/` are listed in `.gitignore`.

`app/lib/content.ts` glob-imports posts at build time (`{ query: "?parsed", eager: true }` parsed by `md-frontmatter.ts`). The CV timeline and home "career" both render `EXPERIENCE` from `app/lib/linkedin.ts` — no separate step files. `linkedin.ts` imports YAMLs directly (parsed at build time by `@modyfi/vite-plugin-yaml`, so `js-yaml` stays out of the client).

### Sealed content (password-gated PII)

LinkedIn fields (employer/school names, locations, certificate URLs, profile photo) are encrypted at build time so the deployed bundle ships ciphertext only. Source yml stays plaintext in the repo — the gate is on the deployed artifact.

- **Config** (`content/linkedin/sensitive.yml`):
  - `fields: <basename>: [<dotted-path>, ...]` — `*` matches any array index; both DE/EN siblings processed; only non-empty strings sealed.
  - `photos: <id>: <path-from-root>` — referenced from JSX as `<SealedImage id="<id>" alt="…" />`. JPGs get a real blurhash; other types fall back to a generic dark gradient (blob still works).

- **Build plugin** (`app/vite/plugins/seal.ts`): reads `REVEAL_PASSWORDS` (comma-separated), generates one 256-bit data key per build, wraps it once per password via PBKDF2-SHA256 (600k iter) + AES-GCM, encrypts every matched field + photo with the data key. Sealed yml values become sentinel strings `\0SEAL:<id>\0`. Exposed via virtual modules `virtual:sealed-secrets` (`{salt, iter, wrapped[], fields, dataKeyHash}`) and `virtual:sealed-photos`. Empty `REVEAL_PASSWORDS` → dev fallback password `"dev"` with a console warning.

- **Runtime** (`app/lib/seal.ts`): `unlock(pw)` tries each wrapped key, on success decrypts everything in-memory + caches the raw data key in `sessionStorage['d3strukt0rs-portfolio:seal:dataKey']`. Returns `'ok' | 'wrong' | 'cooldown'`. `lock()` clears in-memory + revokes photo object URLs. `hydrate()` runs once via `LockButton` mount. Consumers use `isSealed`/`sealedId`/`reveal`/`revealAll`; state observed via `subscribe`/`getState` in `useSyncExternalStore`. Cooldown: 5 wrong → 30 s lockout (persisted in sessionStorage). Two unlock paths: nav `LockButton` modal or terminal `sudo`/`unlock` — both call the same `unlock()`.

- **Threat model**: bundle is public, so determined attackers can grind PBKDF2 offline. Defense is passphrase strength (≥ 12 char random per recipient). Rotation = update `REVEAL_PASSWORDS` GitHub secret + redeploy; each build generates a fresh data key, so old passphrases stop working on next build.

- **Adding a sealed item**: add to `sensitive.yml`; wrap the consumer in `<Sealed value={…} />` (fields) or use `<SealedImage id="<id>" />` (photos). No plugin change needed.

### Styling

- **Tailwind v4 + Sass** dual stack. Two imports in `app/root.tsx`, in order: `tailwind.css` then `main.scss`. `@custom-variant dark (&:where(body.dark, body.dark *))` ties `dark:` to `useTheme`'s body class, not `prefers-color-scheme`. `@theme inline { … }` maps Tailwind tokens (`--color-accent`, `--font-sans`, …) onto runtime CSS custom properties declared on `.ta` / `.ta.light` in `terminal.scss`, so utilities like `bg-accent` re-theme automatically. `app/styles/{terminal,terminal-content}.scss` are barrels that `@use` partials wrapped in `@layer components { … }` so JSX-level Tailwind utilities still win on cascade.
- **No inline `style={{…}}` on JSX.** Only allowed escape hatch: setting a CSS custom property the server can't know (e.g. `style={{'--ta-bar-w': \`${pct}%\`} as React.CSSProperties}`).
- **`@apply` does NOT expand inside `.scss`** — Tailwind's Vite plugin doesn't re-scan Sass-preprocessed output in this plugin order. For reusable bundles, use an `@utility ta-name { @apply … }` block in `tailwind.css`, or apply utilities directly in JSX.
- **Stacking quirk**: `terminal/_base.scss` has `.ta > *:not(...) { position: relative; z-index: 1 }`. Any new direct child of `<body class="ta">` that needs `position: fixed` (cursor overlays, body-portaled modals) must be added to that `:not()` exclusion or it collapses to relative.

### Static artifacts

Emitted by Vite plugins (`vite.config.ts`), no separate postbuild:

- `vite-plugin-sitemap` → `sitemap.xml` (home, `/cv`, `/blog`, each post via `dynamicRoutes`).
- `vite-plugin-robots-ts` → `robots.txt`.
- `app/vite/plugins/static-artifacts.ts` → `404.html` (SPA fallback — Pages only; SSR image doesn't need it) + `atom.xml` (≤20 posts).
- `app/vite/plugins/md-frontmatter.ts` → parses `*.md?parsed` at build time so markdown deps stay out of the client bundle.
- `app/vite/plugins/posts.ts` → shared post loader used by sitemap + atom.
- `app/vite/plugins/seal.ts` → sealed content (see above).

`public/CNAME` (`d3strukt0r.dev`) is copied verbatim.

## Production image (Nix-built OCI)

**No Dockerfile.** Image produced by `flake.nix` via `pkgs.dockerTools.streamLayeredImage`.

- **Build**: `SEAL_DATA_KEY=$(openssl rand -base64 32) nix build --impure .#dockerImage` → `./result` is a docker-load-able tarball (~250 MB tar / ~530 MB on disk).
- **Two derivations**: `d3strukt0rs-portfolio` builds the SSR bundle (`pnpm.fetchDeps` FOD, build, prune, lay at `$out/opt/d3strukt0rs-portfolio/`). `dockerImage` wraps it via `dockerImageStream` piped through the **`fixOciImageHistory`** post-processor (from the shared `nix-utils` flake input) — copies layer `comment → created_by` so Dive shows per-layer Commands, and synthesizes a `HEALTHCHECK CMD` history entry to silence Trivy's DS-0026 false positive.
- **Runtime contents**: `usrBinEnv` + `fakeNss` (with appended nonroot user) + `bashInteractive` + `coreutils` + `gnused` + `which` (pnpm bin shims) + `nodejs-slim_24` + a stripped `curlSlim` (most curl features off — drops krb5/libssh2/libpsl/brotli/zstd) + the portfolio derivation. `bashInteractive` (not plain `bash`) because nodejs-slim transitively pulls it; adding plain bash would ship two shells.
- **Runtime layout**: app lives at `/opt/d3strukt0rs-portfolio/{build,node_modules,package.json}` (from the derivation's installPhase nesting under `$out/opt/...`). User `nonroot:65532` (distroless convention); `/tmp` mode 1777 created in `extraCommands`. CMD `react-router-serve ./build/server/index.js`, found via `PATH=/opt/d3strukt0rs-portfolio/node_modules/.bin:/bin:/usr/bin`. Healthcheck `curl -fsS http://localhost:3000/`.
- **Reproducibility**: `created = createdFromDate self.lastModifiedDate` (helper from `nix-utils.lib.oci`) — clean tree = HEAD commit time → identical config-blob digest from identical sources. Durations written `Interval = secondsToNanos 30` etc. — OCI stores int64 nanoseconds.
- **Required runtime env**: `SEAL_DATA_KEY` (must match build-time value) + `REVEAL_PASSWORDS`.
- **Hardening tricks** (don't undo):
  - `dontFixup`/`dontStrip`/`dontPatchShebangs`/`dontPatchELF = true`. Without them, `patchShebangs` rewrites every `#!/usr/bin/env node` in `node_modules` to absolute `/nix/store/<hash>-nodejs-24…` paths, dragging full nodejs + stdenv + perl + python + gcc-libs into the runtime closure. Plain `/usr/bin/env <prog>` shebangs work because the image ships `usrBinEnv` + `nodejs-slim_24` + `bashInteractive` + `coreutils` + `gnused`.
  - `disallowedReferences = [ pkgs.nodejs_24 ]` — hard-fails the build if the full nodejs sneaks back in.
  - `enableFakechroot = true` — `extraCommands` paths resolve relative to image root.
- **`compose.yml`** is **dev-only**: `nixos/nix:2.34.6`, runs `nix develop --command sh -c "pnpm install && pnpm run dev --host 0.0.0.0"` on 5173. Source bind-mounted; `node_modules/` and `/nix` are named volumes.
- **`pnpmDeps.hash`** is a fixed-output hash. Every lockfile change → new hash. First build with a stale hash fails with `specified: X / got: Y` — copy the `got` value in. Auto-bumped via `bump-pnpm-hash.yml` (Workflows).

## Workflows

- **`ci.yml`** — two parallel jobs.
  - `checks`: lint + typecheck + build. Each step calls `bash .github/scripts/summarize-step.sh "<title>" <cmd>` which streams the command's stdout/stderr to both the job log and `$GITHUB_STEP_SUMMARY` (collapsible `<details>` block per step). `continue-on-error: true` lets later steps run regardless; a trailing `Fail if any check failed` step re-derives the real exit code from `steps.<id>.outcome`. CI build uses a placeholder `SEAL_DATA_KEY` (32 zero bytes, base64) so the seal plugin's strict check passes — bundle is a smoke test, never shipped.
  - `trivy`: builds the Nix OCI image and runs four scans via the same wrapper. **Vulnerability scan uses Grype** (`anchore/scan-action/download-grype@v6` → `grype <image> --fail-on high --only-fixed`), not Trivy: Nix images have no dpkg/rpm/apk DB so `trivy image` only sees pnpm `package.json` files (the entire OS closure is invisible), and `trivy sbom` against a sbomnix CycloneDX skips every `pkg:nix/...` purl as unsupported. Grype's image scanner understands Nix store paths and matches CPEs. **Secret / misconfig / CIS Docker** scans still use `trivy image`. `.grype.yaml` at repo root holds CVE ignore rules (auto-discovered); document the reason per entry and remove once the upstream fix lands in our nixpkgs channel. Prepends `bin/bump-pnpm-hash.sh` so a stale `pnpmDeps.hash` on a Dependabot PR self-heals in-memory before `nix build` (no commit).
- **`deploy-gh-pages.yml`** — `pnpm install --frozen-lockfile` → `SSR=false pnpm run build` → `actions/upload-pages-artifact@v5` → `actions/deploy-pages@v5`. Build receives `SEAL_DATA_KEY` + `REVEAL_PASSWORDS` from secrets. **One-time setup**: Settings → Pages → Source = **GitHub Actions** (else the legacy `jekyll-build-pages` action runs).
- **`docker.yml`** — build + push multi-arch OCI image to Docker Hub on push to `master`/`develop` and `*.*.*` tags. `paths-ignore: [pnpm-lock.yaml, package.json]` skips lockfile-only Dependabot merges (the follow-up bump commit re-fires the workflow with a build-able tree). Four-job pipeline `setup → build → manifest → attest` with strict credential separation:
  - `setup` — single source of truth for the active arch set. Reads `workflow_dispatch.inputs.architectures` (default `amd64,arm64`; RISC-V opt-in, builds under QEMU ~3–4h), joins against an inline META table (`runner`/`timeout`/`nix_system`/`emulate`). Emits matrix JSON + arch list.
  - `build` matrix (per-arch) on `cachix/install-nix-action@v31` + `nix-community/cache-nix-action@v7`: `nix build --impure .#dockerImage` → `syft` SPDX SBOM → uploads `{image.tar, sbom.json}` artifact. Emulated legs run `docker/setup-qemu-action` + write `extra-platforms` + qemu into `/etc/nix/nix.conf`. **No Docker Hub creds on matrix runners.**
  - `manifest` (single runner, `registry:3` service container on `localhost:5000`): buildkit gets `[registry."localhost:5000"] http = true` via `setup-buildx-action`'s `buildkitd-config-inline` (**don't touch host docker daemon's insecure-registries** — restart kills the service container). Loops over arches: `skopeo copy --dest-tls-verify=false docker-archive:image.tar docker://localhost:5000/...` → captures digest → `docker buildx imagetools create` pushes the manifest list to docker.io. Per-arch images are **untagged on docker.io** — reachable only by digest via the manifest list. Then `cosign sign` + `cosign attest --type spdxjson` per arch + per manifest-list tag. Cosign 2.6+ uses the **OCI 1.1 referrers API** (`artifactType: application/vnd.dev.sigstore.bundle.v0.3+json`), not legacy `sha256-X.sig` tags — Docker Hub's tag listing won't show them; use `oras discover -o tree` or `cosign verify`.
  - `attest` matrix: `actions/attest@v4` per arch, `subject-name: docker.io/${{ vars.IMAGE_NAME }}` (the action parses the first segment as a registry name).
  - **Failure mode**: `manifest` needs every `build` leg to succeed; nothing leaks to Docker Hub on partial success.
  - Requires secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` + `SEAL_DATA_KEY`.
- **`bump-pnpm-hash.yml`** — push-triggered on `master`/`develop` when `pnpm-lock.yaml`/`package.json` changes. Runs `bin/bump-pnpm-hash.sh` (shared with `ci.yml`'s trivy job): swaps the hash with `lib.fakeHash`, runs `nix build` to provoke the FOD mismatch, extracts the real value from the `got:` line, writes it back, commits + pushes under `github-actions[bot]`. Self-loop guarded by `if: github.actor != 'github-actions[bot]'`. **Requires `GH_PAT`** — plain `GITHUB_TOKEN` commits don't trigger downstream workflows (docker.yml would stay queued).
- **`linkedin-sync.yml`** — `cron '0 6 * * 1'` (weekly) + `workflow_dispatch`. Writes a throwaway `.env` from the `LINKEDIN_DMA_TOKEN` secret, runs `pnpm run sync:linkedin:api`, commits any `content/linkedin/` diff under `github-actions[bot]` via `GH_PAT` so the resulting push fires `docker.yml`. Fails loud on API errors (token expiry, rejected version) — `from-api.ts` exits non-zero without writing partial output, so the existing YAMLs stay intact and the workflow turns red instead of silently committing wiped data.
- **`release.yml`** — `googleapis/release-please-action@v5` on push to `master`. Scans conventional commits since the last release, opens (or updates) a release PR with version bump + `CHANGELOG.md`; on merge cuts a GitHub Release + git tag. The tag is the trigger for `docker.yml`'s multi-arch publish. Managed files: `package.json` (`version`, default for `release-type: node`) + `flake.nix` (via `extra-files`; line marked `# x-release-please-version`). Config in `release-please-config.json` + `.release-please-manifest.json`. Uses `GH_PAT` — `GITHUB_TOKEN`-created tags don't fire downstream workflows. A follow-up `reattribute` job checks out the `release-please--branches--master` branch and runs `git commit --amend --reset-author --no-edit` + `--force-with-lease` push to rewrite the release commit author from the PAT owner to `github-actions[bot]`, since release-please-action has no input to override the commit author.
- `dependabot-validate.yml` / `dependabot-automerge.yml` / `dockerhub-description.yml` / `greetings.yml` / `label.yml` / `stale.yml` — peripheral automation.

## Devcontainer

`.devcontainer/devcontainer.json` — `mcr.microsoft.com/devcontainers/base:debian` + features: `common-utils`, `node:1` (v24), `docker-outside-of-docker`, `github-cli`, `devcontainers-extra/features/act`. Forwards 5173/4173/3000. `postCreateCommand: corepack enable && pnpm install`. **Nix is not preinstalled** — for image builds, run inside `nixos/nix:2.34.6` (see `compose.yml`) or install ad-hoc.

## Gotchas

- **Hash routing is *not* used** — Pages relies on `404.html = index.html` SPA fallback; the SSR image resolves routes server-side.
- **i18n arrays** — `t('hero.now', { returnObjects: true })`. Without the option you get the key back as a string.
- **Node version bump** — touch all four spots in lockstep: `package.json:engines.node`, `flake.nix` (nodejs-slim + pnpm refs), every CI workflow that calls `actions/setup-node`, and `.devcontainer/devcontainer.json`'s `node:1` feature `version`. Bumping the nixpkgs channel is often the easier path.
- **`pnpmDeps.hash`** — every `pnpm-lock.yaml` change needs a paired hash bump in `flake.nix`. `bump-pnpm-hash.yml` handles it on `master`/`develop`; `ci.yml`'s trivy job auto-heals in-memory. For local manual `pnpm add`/`update`, run `./bin/bump-pnpm-hash.sh`.
- **`--impure` is required for `nix build`** — `flake.nix` reads `SEAL_DATA_KEY` and `DOCKER_LABELS_JSON` via `builtins.getEnv`. Without `--impure` both come back empty and the build silently produces a broken bundle.
- **`d3strukt0rs-portfolio` is in `streamLayeredImage.contents`** — only safe because its `installPhase` nests output under `$out/opt/d3strukt0rs-portfolio/`. dockerTools symlinks every top-level path of each contents package into rootfs; don't move files back to `$out/` root.
- **`fixOciImageHistory` lives in `nix-utils`** — if Trivy starts flagging DS-0026 again, the layer / healthcheck synthesis logic is in `github:d3strukt0r/nix-utils`, not this repo. Local edits via `inputs.nix-utils.url = "path:/abs/path/nix-utils"`; `nix flake update nix-utils` to re-pin.
- **`docker.yml`'s `registry:3` service container** — **don't** add `localhost:5000` to the host docker daemon's `insecure-registries`. Restarting docker would tear down the service container. Buildkit gets the insecure flag inline via `setup-buildx-action`; skopeo gets `--dest-tls-verify=false`. If you need another tool to talk to it, pass the equivalent flag.
- **pnpm via Corepack** (host/devcontainer/CI only). `packageManager` field in `package.json` pins the version. `corepack enable` once on dev machines; don't `npm i -g pnpm`. Production image bypasses Corepack — uses `pkgs.pnpm_10` at build time, ships zero pnpm at runtime.
- **`position: fixed` inside `backdrop-filter` ancestors** — `TaNav` and any `.ta-glass` create new containing blocks. `LockModal` works around this by `createPortal`-ing to `document.body`. Apply the same pattern for any new modal rendered from inside a glass surface.
- **No emoji icons** — emoji glyphs render inconsistently across platforms (Windows colored emoji for U+1F512 is the worst offender). Use inline SVG (`app/components/icons/*.tsx`, `currentColor`). The `↗` arrow in `CertLink` is tolerated because it's a BMP geometric shape, not an emoji.
- **`release.yml`-managed lines** — the `version = "X.Y.Z"; # x-release-please-version` line in `flake.nix` is bot-managed. Hand-edits get overwritten on the next release PR; bump out-of-band via `.release-please-manifest.json` instead.
