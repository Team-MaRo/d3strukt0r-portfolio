# D3strukt0r's Portfolio

Personal portfolio site for [Manuele](https://github.com/D3strukt0r) — React Router v7 (Remix successor), Tailwind v4, Sass, Node 24. Shipped two ways: GitHub Pages (SPA) and a Docker image (SSR via `react-router-serve`).

[![License](https://img.shields.io/github/license/d3strukt0r/d3strukt0r.github.io?label=License)](LICENSE.txt)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa)][code-of-conduct]
[![Docker Pulls](https://img.shields.io/docker/pulls/d3strukt0r/portfolio)](https://hub.docker.com/r/d3strukt0r/portfolio)

## Running the container

The published image serves the SSR build on port `3000`.

### Prerequisites

You need [Docker](https://docs.docker.com/get-docker/) installed.

* [Windows](https://docs.docker.com/desktop/install/windows-install/)
* [macOS](https://docs.docker.com/desktop/install/mac-install/)
* [Linux](https://docs.docker.com/engine/install/)

### Usage

Pull and run the latest image:

```shell
docker run --rm -p 3000:3000 d3strukt0r/portfolio:latest
```

Then open <http://localhost:3000>.

Pin to a specific version (recommended for production):

```shell
docker run --rm -p 3000:3000 d3strukt0r/portfolio:1.0.0
```

Run on a different host port:

```shell
docker run --rm -p 8080:3000 d3strukt0r/portfolio:latest
```

Get a shell inside the container:

```shell
docker run --rm -it --entrypoint sh d3strukt0r/portfolio:latest
```

### docker compose

```yaml
services:
  web:
    image: d3strukt0r/portfolio:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      SEAL_DATA_KEY: ${SEAL_DATA_KEY}
      REVEAL_PASSWORDS: ${REVEAL_PASSWORDS}
```

### Environment variables

* `SEAL_DATA_KEY` — **required**. Long-lived 32-byte base64 secret. Must match the value the image was built with (the published `d3strukt0r/portfolio` image is built with the maintainer's key). Generate a fresh one for your own builds: `openssl rand -base64 32`.
* `REVEAL_PASSWORDS` — **required**. Comma-separated list of unlock passwords (e.g. `alice,bob`). Freely rotatable: change the value, restart the container, the new list is in effect on the next page load. Old `sessionStorage` unlocks in already-open tabs aren't invalidated until those tabs close.
* `PORT` — port `react-router-serve` listens on. Default `3000`.
* `NODE_ENV` — set to `production` in the image. Don't override.

The server refuses to start if `SEAL_DATA_KEY` or `REVEAL_PASSWORDS` is missing.

```shell
docker run --rm -p 3000:3000 \
  -e SEAL_DATA_KEY="$SEAL_DATA_KEY" \
  -e REVEAL_PASSWORDS="alice,bob" \
  d3strukt0r/portfolio:latest
```

### Building your own image

To produce an image encrypted under your own data key, pass it as a BuildKit secret so it doesn't end up in image layers or build logs:

```shell
SEAL_DATA_KEY="$(openssl rand -base64 32)" \
docker build \
  --secret id=seal_data_key,env=SEAL_DATA_KEY \
  -t my-portfolio .
```

Save that `SEAL_DATA_KEY` somewhere safe — you'll need to pass the same value at `docker run`. Rotating the data key requires re-encrypting the content, which means a rebuild; passwords don't.

### Image details

* **Base:** `node:24-slim` (Debian)
* **Server:** `@react-router/serve` (SSR)
* **Exposed port:** `3000`
* **Healthcheck:** `wget` against `/` every 30 s
* **Architectures:** `linux/amd64`, `linux/arm64`

### Tags

* `latest` — current `master`
* `<major>.<minor>` and `<major>.<minor>.<patch>` — semver releases
* `sha-<short>` — exact commit
* `master`, `develop` — branch tips

Full list at [hub.docker.com/r/d3strukt0r/portfolio](https://hub.docker.com/r/d3strukt0r/portfolio/tags).

## Development

For working on the site itself (not just running the published image).

### Prerequisites

* [Git](https://git-scm.com/)
* [Node.js 24+](https://nodejs.org/) with [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`) — pnpm is pinned via `packageManager` in `package.json`.

Or use the included devcontainer (`.devcontainer/devcontainer.json`) — works in VS Code Dev Containers and GitHub Codespaces.

### Setup

```shell
git clone git@github.com:D3strukt0r/d3strukt0r.github.io.git
cd d3strukt0r.github.io
pnpm install
pnpm run dev
```

The dev server runs on <http://localhost:5173> with HMR.

### Common commands

* `pnpm run dev` — Vite dev server (5173) with HMR
* `pnpm run build` — production build → `build/`
* `pnpm run typecheck` — `react-router typegen && tsc --noEmit`
* `pnpm run lint` / `pnpm run lint:fix` — ESLint
* `pnpm run preview` — serve the built client on 4173

LinkedIn data sync (see `bin/linkedin/`):

* `pnpm run sync:linkedin:csv` — import from a "Download your data" CSV export
* `pnpm run sync:linkedin:api` — fetch live via the LinkedIn Member Data Portability API (needs `LINKEDIN_DMA_TOKEN` in `.env`)

### Building the image locally

```shell
docker build -t d3strukt0r.github.io:dev .
docker run --rm -p 3000:3000 d3strukt0r.github.io:dev
```

There is also a `compose.yml` for a containerized dev server with HMR:

```shell
docker compose up --build
```

## Built with

* [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/)
* [Vite 8](https://vitejs.dev/)
* [Tailwind CSS v4](https://tailwindcss.com/) + [Sass](https://sass-lang.com/)
* [react-i18next](https://react.i18next.com/) (EN/DE)
* Node 24 on `node:24-slim`

## Contributing

Please read [CONTRIBUTING.md][contributing] for details on our code of conduct and the process for submitting pull requests.

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

## Versioning

We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository][gh-tags].

## Authors

### Special thanks for all the people who had helped this project so far

- **Manuele** - [D3strukt0r](https://github.com/D3strukt0r)

See also the full list of [contributors][gh-contributors] who participated in this project.

### I would like to join this list. How can I help the project?

We're currently looking for contributions for the following:

- [ ] Bug fixes
- [ ] Translations
- [ ] etc...

For more information, please refer to our [CONTRIBUTING.md][contributing] guide.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

This project currently uses no third-party libraries or copied code.

[gh-tags]: https://github.com/D3strukt0r/d3strukt0r.github.io/tags
[gh-contributors]: https://github.com/D3strukt0r/d3strukt0r.github.io/contributors
[contributing]: https://github.com/D3strukt0r/.github/blob/master/CONTRIBUTING.md
[code-of-conduct]: https://github.com/D3strukt0r/.github/blob/master/CODE_OF_CONDUCT.md
