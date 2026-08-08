# Hosting

Two places the same bundle can live, and what each one needs.

`Dockerfile` · `Caddyfile` · `.voodu/pwa.voodu` — the VM
`public/_redirects` · `public/_headers` · `wrangler.toml` — Cloudflare Pages

## Why a static app needs a server at all

The build produces files. Files answer `/` and `/assets/index-abc.js`, and
nothing else — `/invite/<token>` and `/stats` are the router's, and the router
cannot run until something has been served. So every host has to be told the
same thing twice:

1. **Any path that is not a file is `index.html`,** with status 200 so the
   address stays what the person opened. That is what the router reads.
2. **Hashed assets cache forever; the shell does not cache at all.** The other
   way round, a returning phone loads the old bundle and asks for assets a
   deploy has already deleted.

Neither is a default anywhere, and both are one line.

## The VM

The obvious question is why, given that voodu's ingress *is* Caddy. Because the
plugin is a reverse proxy and nothing else — deliberately. The whole surface of
`ingress` is `host`, `service`, `port`, `tls {}`, `location {}` (`path` and
`strip`) and `lb {}`; the docs put it plainly: **"No `rewrite`, no `headers`, no
middleware… Custom HTTP transformations belong in your app."**

A reverse proxy needs something to forward *to*, and a pile of files is not a
thing that can be forwarded to. Neither of the two rules above is expressible at
the ingress, by design.

So the image runs its own Caddy. `caddy file-server` alone would serve the files
and 404 every deep link — the `Caddyfile` exists for `try_files` and the cache
split, which is exactly those two rules and nothing more. TLS and the hostname
are not in it: those belong to the ingress, one layer out.

```
browser → voodu ingress (TLS, host) → container caddy (files, try_files) → dist/
```

## Cloudflare Pages

Pages serves the files itself, so there is no server to configure — the two
rules become two files that ship inside `dist/`:

- `public/_redirects` → `/*  /index.html  200`
- `public/_headers` → the cache split

`wrangler.toml` names the output directory for `wrangler pages deploy`. With the
git integration, the build command and root directory live in the project's
settings instead:

| Setting | Value |
|---|---|
| Root directory | *(repo root)* |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @contagorda/pwa build` |
| Output directory | `apps/pwa/dist` |

## The part that catches people

**`VITE_*` values are baked in at build time.** There is no runtime
configuration for a static bundle: pointing it at another API means building it
again. Which means they are set in different places on the two hosts, and in
neither of them where secrets go.

| | Where |
|---|---|
| VM | `build { args = { … } }` in `.voodu/pwa.voodu`, interpolated from the shell |
| Pages | build environment variables, in the project's settings |

On the VM the keys have to be listed in `build { args }` — docker needs a
`--build-arg` for each — but the *values* come from `${VAR}`. The obvious wish
is to keep those on the controller with `vd config` and never in a shell.
`env_from` does feed a bucket into `${VAR}` at parse time, which is exactly
that; the catch is that **the lookup only runs for a local apply.** With
`-r prod` the CLI forwards over SSH and interpolation stays shell-only, so for
this repo the values live in a gitignored `.envrc` — see `.envrc.example`.

Nothing secret can travel either way — whatever goes in comes out readable in
the bundle. The Clowk publishable key is fine there by design; the secret key
never leaves the API.

`VITE_API_URL` and `VITE_CLOWK_PUBLISHABLE_KEY` are required.
`VITE_CLOWK_SUBDOMAIN_URL` is optional: the publishable key resolves the
instance on its own, and setting it only skips that lookup.

## Keeping the two honest

`Caddyfile`, `_redirects` and `_headers` say the same two things in three
dialects. When one changes, the others have to. The symptom of forgetting is a
bug that reproduces on one host and not the other — a deep link that works
locally and 404s in production, or a phone stuck on last week's bundle.

Nothing enforces the agreement today. If a third host ever shows up, that is the
moment to generate all three from one source rather than write a fourth.
