# Rails API. Called by the root Makefile, but works standalone from here.

.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help setup test test-one lint typecheck server console migrate

help:
	@echo "setup test test-one lint typecheck server console migrate"

setup:
	@echo "-----> bundle"
	@bundle install --quiet
	@echo "-----> databases"
	@bin/rails db:prepare

# rspec-turbo creates and schema-loads the worker databases itself, keyed by a
# fingerprint of schema.rb and seeds.rb, so a migration does not need a separate
# prepare step here.
test:
	@bin/test

# Single process, for when a failure needs a debugger or an isolated run.
#   make test-one SPEC=spec/models/transaction_spec.rb
test-one:
	@bundle exec rspec $(SPEC)

lint:
	@echo "-----> rubocop"
	@bundle exec rubocop

# Ruby has no separate typecheck step; the root `make typecheck` still calls
# this, so it has to exist and succeed rather than fail the whole fan-out.
typecheck:
	@echo "-----> (no typecheck for ruby)"

server:
	@bin/rails server -p 3000

console:
	@bin/rails console

migrate:
	@bin/rails db:migrate
