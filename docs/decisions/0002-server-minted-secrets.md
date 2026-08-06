# 0002 — What only the server may create

## Status

Accepted. The front-end runs on a mock today; this is the rule the mock is
standing in for, and the shape the API must land on.

## Context

The invite flow raised the question: the PWA generates an invite token locally
today, because the mock has to produce something. Should it?

No. And the question generalises past invites.

## Decision

Three kinds of value are minted by the server, never by a client.

### Identifiers

`uuidv7()` as a column default in Postgres. Already decided, restated here
because it belongs with the rest: ids are ordered by time, and a client cannot
be trusted to say when something happened — a wrong clock or a crafted request
puts a row anywhere in the ordering it likes.

### Bearer secrets

An invite token is a credential: whoever holds the link joins the ledger. A
client-minted one fails three ways at once.

Its randomness is whatever that browser offers, unverifiable from the outside —
and the app already ships a fallback for origins where `crypto.randomUUID` does
not exist, which is exactly the kind of substitution nobody should be making for
a secret.

A modified client picks its own token, including one it has seen before or one
it can guess later.

And it removes the only place where issuing rules can hold: expiry, single use,
one live invite per ledger, a ceiling on how many can be minted.

So: `POST /ledgers/:id/invites` returns a token of at least 32 bytes from a
cryptographic source, encoded base64url. A uuid is not the right shape — it
carries version and variant bits and is meant to be unique, not unguessable.

**Stored as a digest, never in the clear.** The token is shown once, in the
response that created it. A database or a log that leaks invite rows must not
hand over working invitations — the same reasoning already applied to refresh
tokens in Clowk, and an invite is no less of a key to someone's money.

Lookup is by digest, so `GET /invites/:token` hashes and compares. A revoked,
spent or expired token answers identically to one that never existed: to a
person holding a dead link the distinction changes nothing, and to anyone
probing tokens it is a hint.

### Times that assert a fact

`paid_at`, `accepted_at`, `revoked_at`, `expires_at`, `created_at`. The client
says *that* a bill was paid; the server says *when* it recorded it. A client
timestamp is a claim about the past that can be backdated into a month someone
has already closed.

The exception is `date` on a transaction — the day the money moved, which is a
statement about the world that the person is entitled to make, including for
last Tuesday.

## Consequences

The ports already say this. `createInvite(ledgerId)` takes no token and returns
one; `setPaid(id, paid)` takes no time and returns the row the server stamped.
Swapping the mock for HTTP is implementing the same interfaces — no component
learns anything new.

The mock generating a token locally is a mock doing what a mock does. It is not
a preview of the API, and the token it makes is not a secret.
