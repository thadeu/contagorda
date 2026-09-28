# Landing page. Called by the root Makefile, but works standalone from here.

.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help setup test test-turbo lint typecheck dev build deploy

help:
	@echo "setup test test-turbo lint typecheck dev build deploy"

# Installs from the workspace root, like the PWA: one lockfile for the monorepo.
setup:
	@echo "-----> pnpm install"
	@pnpm -w install

# No test suite: a static page with no logic. The verbs exist so the root
# fan-out can call them on every app.
test:
	@true

test-turbo:
	@true

lint:
	@pnpm lint

typecheck:
	@pnpm typecheck

dev:
	@pnpm dev

build:
	@pnpm build

deploy:
	@pnpm deploy:prod
