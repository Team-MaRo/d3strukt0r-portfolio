# syntax=docker/dockerfile:1.7

# ── Dev deps (incl. build tooling) ───────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# ── Build (SSR bundle: build/client + build/server) ──────
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm run build

# ── Production deps only ─────────────────────────────────
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# ── Runtime (react-router-serve) ─────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost:3000/ || exit 1

CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]
