# Conta Gorda — root orchestration.
#   make test     every app's suite
#   make check    everything CI runs: lint + typecheck + test
#   make setup    install deps and prepare databases
#
# Each app under apps/ owns a Makefile exposing the same verbs, and this file
# only fans out to them. Apps are discovered by wildcard rather than listed, so
# adding apps/ios joins `make test` by having a Makefile — there is no registry
# here to forget to update.

.DEFAULT_GOAL := help
SHELL := /bin/bash

APPS := $(patsubst apps/%/Makefile,%,$(wildcard apps/*/Makefile))

.PHONY: help setup test test-turbo lint typecheck check

help:
	@echo "apps:  $(APPS)"
	@echo "all:   setup test test-turbo lint typecheck check"
	@echo "one:   test-<app>  lint-<app>  typecheck-<app>  setup-<app>"

setup: $(addprefix setup-,$(APPS))

test: $(addprefix test-,$(APPS))

# Explicit, so the test-% pattern cannot read "turbo" as an app name. The
# per-app rule below is `turbo-%` rather than `test-turbo-%` for the same
# reason: `test-turbo-pwa` matches test-% too, and make resolves that collision
# in a way that is not worth relying on.
test-turbo: $(addprefix turbo-,$(APPS))

lint: $(addprefix lint-,$(APPS))

typecheck: $(addprefix typecheck-,$(APPS))

check: lint typecheck test

# Per-app escape hatch: `make test-rapi`, `make lint-pwa`.
#
# These patterns treat whatever follows the dash as an app name, so a typo or a
# new verb shows up as a missing directory. `guard` turns that into a sentence
# instead of make's "No such file or directory".
.PHONY: setup-% test-% turbo-% lint-% typecheck-%

guard = @test -d apps/$(1) || { echo "no such app: apps/$(1)  (apps: $(APPS))"; exit 1; }

setup-%:
	$(call guard,$*)
	@echo "-----> setup $*"
	@$(MAKE) --no-print-directory -C apps/$* setup

test-%:
	$(call guard,$*)
	@echo "-----> test $*"
	@$(MAKE) --no-print-directory -C apps/$* test

turbo-%:
	$(call guard,$*)
	@echo "-----> test-turbo $*"
	@$(MAKE) --no-print-directory -C apps/$* test-turbo

lint-%:
	$(call guard,$*)
	@echo "-----> lint $*"
	@$(MAKE) --no-print-directory -C apps/$* lint

typecheck-%:
	$(call guard,$*)
	@echo "-----> typecheck $*"
	@$(MAKE) --no-print-directory -C apps/$* typecheck
