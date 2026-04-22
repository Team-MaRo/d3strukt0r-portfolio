# syntax=docker/dockerfile:1.7

# ── Build ────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Install deps first for better layer caching.
# Corepack reads the pnpm version from the `packageManager` field in package.json.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build the SPA + emit 404.html/sitemap.xml/robots.txt/atom.xml.
COPY . .
RUN pnpm run build

# ── Runtime ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Replace default site config with our SPA-fallback config.
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static output from the builder.
COPY --from=builder /app/build/client /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
