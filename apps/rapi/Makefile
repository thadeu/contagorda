# Rails API. Called by the root Makefile, but works standalone from here.

.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help setup test test-turbo test-one lint typecheck server console migrate

help:
	@echo "setup test test-turbo test-one lint typecheck server console migrate"

setup:
	@echo "-----> bundle"
	@bundle install --quiet
	@echo "-----> databases"
	@bin/rails db:prepare

# Plain rspec locally. While the suite is this size, spinning up worker
# databases costs more than the parallelism saves, and a single process keeps
# `binding.irb` usable. `maintain_test_schema!` keeps the one test database in
# sync after a migration, so there is no prepare step to remember.
test:
	@bundle exec rspec

# What CI runs. There the tradeoff flips: runners bill wall-clock time, so
# splitting across workers is what keeps the bill down. rspec-turbo creates and
# schema-loads the worker databases itself, cached against a fingerprint of
# schema.rb and seeds.rb.
test-turbo:
	@bin/test

# One file or folder.
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
