# Conta Gorda

Personal finance app. Mobile-first PWA today, native iOS later, both against one
API.

## Layout

```
apps/
  pwa/      Vite + React + TypeScript (installable PWA)
  rapi/     Rails 8, API-only
  ios/      SwiftUI (phase 2)
packages/   Shared TypeScript: API client, domain rules
infra/      voodu manifests
docs/
  plans/       architecture and planning notes
  decisions/   ADRs
  api/         openapi.yaml — the contract both clients follow
tools/      dev scripts
```

`pnpm-workspace.yaml` covers the JavaScript side only. `apps/rapi` has its own
`Gemfile` and `apps/ios` will have its own Xcode project — a polyglot monorepo
is held together by convention, not by forcing one package manager over all of
it.

## Running it

```sh
pnpm install
pnpm dev                            # PWA on :5173

cd apps/rapi
bundle install
bin/rails db:prepare
bin/rails server -p 3000            # API on :3000
```

## Tests

```sh
cd apps/rapi
bin/test                        # whole suite, parallel
bin/test spec/models            # a folder or file
RSPEC_TURBO_MAX=8 bin/test      # more workers
bundle exec rspec               # single process, when isolating something
```

The suite runs in parallel from day one, through
[rspec-turbo](https://github.com/thadeu/rspec-turbo). It balances by actual
example count from a single `--dry-run` rather than by file, so one fat spec
file cannot leave a worker idle while another grinds.

`database.yml` appends `TEST_ENV_NUMBER` to the test database name, so worker 2
gets `contagorda_test2` and workers never share data. The variable is empty for
a plain `rspec` run, so both paths keep working. Worker databases are created
and schema-loaded automatically, cached against a fingerprint of `db/schema.rb`
and `db/seeds.rb` — a schema change re-runs setup on its own. Force it with
`RSPEC_TURBO_FORCE_SETUP=1`.

Default is 2 workers: the suite is small enough that more processes cost more in
database setup than they save in wall clock. Raise it when that stops being
true.

Writing a spec that depends on global state — a fixed id, a shared row, the
current test's position in the file — will pass alone and fail in parallel. That
is the point: the parallel run is what catches it.

## Authentication

Auth is brokered by [Clowk](https://clowk.in). This API verifies tokens against
Clowk's published keys (RS256/JWKS) and checks the `aud` claim; it never issues
tokens. The PWA holds the access token in memory and a rotating refresh token in
storage, so a reload does not sign the user out.

Nothing here needs Clowk's signing secret. `CLOWK_SECRET_KEY` is only used for
server-to-server calls to the Clowk API.

## Conventions

- **Money is `amount_cents`, an integer.** Never a float.
- **Direction comes from the `kind` column**, never from a negative amount.
  `amount_cents` is always positive, so no report can forget an `abs`.
- **Every primary key is a UUIDv7** — time-ordered, so it indexes well, and
  never a guessable sequential id crossing the API boundary.
- **Every query is scoped through the current user** (`current_user.transactions`,
  not `Transaction.find`). Defence in depth against IDOR: unguessable ids are
  not the defence, the scope is.
