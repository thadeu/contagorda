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
