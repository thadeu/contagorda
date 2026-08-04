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

.PHONY: help setup test lint typecheck check

help:
	@echo "apps:  $(APPS)"
	@echo "all:   setup test lint typecheck check"
	@echo "one:   test-<app>  lint-<app>  typecheck-<app>  setup-<app>"

setup: $(addprefix setup-,$(APPS))

test: $(addprefix test-,$(APPS))

lint: $(addprefix lint-,$(APPS))

typecheck: $(addprefix typecheck-,$(APPS))

check: lint typecheck test

# Per-app escape hatch: `make test-rapi`, `make lint-pwa`.
.PHONY: setup-% test-% lint-% typecheck-%

setup-%:
	@echo "-----> setup $*"
	@$(MAKE) --no-print-directory -C apps/$* setup

test-%:
	@echo "-----> test $*"
	@$(MAKE) --no-print-directory -C apps/$* test

lint-%:
	@echo "-----> lint $*"
	@$(MAKE) --no-print-directory -C apps/$* lint

typecheck-%:
	@echo "-----> typecheck $*"
	@$(MAKE) --no-print-directory -C apps/$* typecheck
