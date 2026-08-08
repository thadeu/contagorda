# The PWA, built and then served as files.
#
# **The build context is the repo root, wherever you run this from.** The
# lockfile and the workspace definition live up there, and `pnpm install
# --frozen-lockfile` without them is an install of different versions than the
# ones anybody tested. There is no lockfile inside `apps/pwa` and there should
# not be one.
#
# Every path below is therefore relative to the repo root, not to this file:
#
#   docker build -f apps/pwa/Dockerfile .          # from the repo root
#   docker build -f Dockerfile ../..               # from apps/pwa
#
# The manifest says the same thing with `context = "../.."`, so `vd apply` works
# from this directory.
#
# Vite inlines every `VITE_*` value at build time. There is no runtime
# configuration for a static bundle — the variables are build arguments here,
# and pointing this image at another API means building it again. That is also
# why nothing secret can be passed: whatever goes in comes out readable in the
# bundle.

FROM node:24-alpine AS build

RUN corepack enable

WORKDIR /app

# The manifests first, on their own layer. Source changes far more often than
# dependencies do, and copying it before the install would redo the install on
# every edit.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/pwa/package.json apps/pwa/

RUN pnpm install --frozen-lockfile --filter @contagorda/pwa...

COPY apps/pwa apps/pwa

ARG VITE_API_URL
ARG VITE_CLOWK_PUBLISHABLE_KEY
ARG VITE_CLOWK_SUBDOMAIN_URL

# `pnpm build` runs `tsc -b` first, so an image that builds is an image whose
# types hold. A deploy is a bad place to find out otherwise.
RUN pnpm --filter @contagorda/pwa build

FROM caddy:2-alpine

COPY apps/pwa/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/pwa/dist /srv

EXPOSE 80
