# syntax=docker/dockerfile:1.7

# ── Base image: Nix with flakes enabled ──────────────────
# Versions of node/pnpm/wget come from flake.nix, not from the base image.
# Pinning by tag (not digest) here so it stays readable; CI/Dependabot's
# docker ecosystem will manage updates against this tag.
FROM nixos/nix:2.34.6 AS base
ENV NIX_CONFIG="experimental-features = nix-command flakes"
SHELL ["/bin/sh", "-euxc"]
WORKDIR /opt/portfolio

# ── Dev deps + build (SSR bundle: build/client + build/server) ──
FROM base AS build
COPY flake.nix flake.lock ./
# Pre-realise the devShell into the store so subsequent RUNs reuse the cache.
RUN nix develop --command true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN nix develop --command pnpm install --frozen-lockfile
COPY . .
RUN --mount=type=secret,id=seal_data_key <<EOT
    { set +x; } 2>/dev/null
    export SEAL_DATA_KEY="$(cat /run/secrets/seal_data_key 2>/dev/null || true)"
    set -x
    nix develop --command pnpm run build
EOT

# ── Production deps only ─────────────────────────────────
FROM base AS prod-deps
COPY flake.nix flake.lock ./
RUN nix develop --command true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN nix develop --command pnpm install --frozen-lockfile --prod

# ── Runtime: minimal nix closure + non-root user ─────────
FROM base AS runtime
ENV NODE_ENV=production PORT=3000

COPY flake.nix flake.lock ./
# Realise only the runtime closure (node + wget + cacert, no pnpm/build tools)
# and expose its bin/ on PATH so any UID can resolve `node` and `wget`.
RUN nix build --out-link /opt/runtime .#runtime
ENV PATH=/opt/runtime/bin:$PATH \
    SSL_CERT_FILE=/opt/runtime/etc/ssl/certs/ca-bundle.crt \
    NIX_SSL_CERT_FILE=/opt/runtime/etc/ssl/certs/ca-bundle.crt

# Default Non-Root User Policy (Docker Scout): run as nonroot:65532, the
# distroless convention (matches gcr.io/distroless/* and k8s `runAsNonRoot`).
# nixos/nix doesn't ship adduser/useradd, so write the records directly —
# this is the canonical pattern (cf. dockerTools.shadowSetup in nixpkgs).
RUN <<EOT
    echo 'nonroot:x:65532:65532::/opt/portfolio:' >> /etc/passwd
    echo 'nonroot:x:65532:' >> /etc/group
    mkdir -p /opt/portfolio
    chown 65532:65532 /opt/portfolio
EOT

COPY --from=prod-deps --chown=nonroot:nonroot /opt/portfolio/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /opt/portfolio/build ./build
COPY --chown=nonroot:nonroot package.json ./

USER nonroot
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost:3000/ || exit 1

CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]
