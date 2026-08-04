# PWA. Called by the root Makefile, but works standalone from here.

.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help setup test test-turbo lint typecheck dev build preview

help:
	@echo "setup test test-turbo lint typecheck dev build preview"

# Installs from the workspace root: pnpm resolves the whole monorepo lockfile,
# and installing from inside a workspace package would fight that.
setup:
	@echo "-----> pnpm install"
	@pnpm -w install

test:
	@pnpm test

# Same command: vitest already runs spec files across workers by default, so
# there is no separate parallel mode to switch into. The verb exists so the
# root fan-out can call it on every app.
test-turbo:
	@pnpm test

lint:
	@pnpm lint

typecheck:
	@pnpm typecheck

dev:
	@pnpm dev

build:
	@pnpm build

preview:
	@pnpm preview
