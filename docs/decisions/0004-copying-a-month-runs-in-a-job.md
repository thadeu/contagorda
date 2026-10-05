# 0004 — Copying a month runs in a job

## Status

Accepted.

## Context

A month usually starts as the last one did: the same rent, the same
subscriptions, the same list of things to pay. Entering them again by hand is
the most repeated chore in the app, so a month can be copied into another.

Two things about that are new. It writes many rows, and the person is waiting at
a phone, so it must not hold a request open while it does. And it is the first
work in the API that has to outlive the request that asked for it, so the API
needed somewhere to run it.

## Decision

### A job, with a record the client can watch

`POST /months/:month/clone` answers `202` with a `month_clones` row and enqueues
a job. The job writes the copies in batches, each in its own transaction, and
the client reads the row back every second. The target month fills while it
runs, because every batch is committed and bumps the cache stamp before the next
one starts.

The row exists because the job outlives the request: it is the only place the
client can learn that the copy is still going, finished, or gave up.

### Solid Queue, in the primary database, inside Puma

Not Sidekiq: the only Redis is a cache with persistence switched off, so a
restart would lose the queue, and a worker process is a second Rails process on
a 256Mi pod. Not the default adapter: it keeps jobs in memory, so a deploy in the
middle of a copy would drop it without a trace.

The tables live in the primary database rather than the separate one the
installer sets up. The queue holds one short job per copied month; a second
database is a second thing to create, back up and point `DATABASE_URL` at, for
tables that are empty most of the day. The migration is the gem's schema,
unchanged.

It runs as threads of the Puma process (`solid_queue_mode :async`), not as
forked processes. Two worker threads share the five connections the pod already
has. Revisit this if a second kind of job arrives that is long or heavy: that is
the point where a worker process of its own earns its memory.

### Safe to run twice

A pass starts by finding which originals already have a copy in the target month
(`transactions.cloned_from_id`) and writes only the rest. That one rule makes
three things true at once: a job retried after an error finishes the work instead
of repeating it, an interrupted copy can be resumed, and copying the same month
again by mistake adds nothing.

The job retries three times and then marks the row `failed`, which is what stops
the client from waiting. What was written stays.

One active copy per ledger and target month is a partial unique index, not a
check in the controller. Two taps would otherwise fall into the gap between the
check and the insert, and two passes into the same month would each count the
rows the other had not written yet.

### What is copied

Account, category, kind, amount and description, on the same day of the month,
attributed to whoever asked. The 31st lands on the last day a shorter month has;
this does not chain the way a series does (ADR 0001), because each copy is read
from its original and not from the copy before it.

Not copied:

- **Whether it was paid.** The new month has not happened, and a row marked paid
  is a claim about a month nobody has lived through. The same reason a series
  settles only its first occurrence.
- **A row of a series that already wrote into the target month.** The series
  wrote it, and a copy would double the bill.
- **A row of a series that is not monthly.** A yearly insurance or a bill every
  second month is not due next month, and a copy would put it there.
- **Rows on an archived account.** Nothing new is written to one.

These are counted in `skipped` and said to the person when it finishes, so a
month that came out shorter than the original is not read as a bug.

A row of a **monthly series that wrote nothing into the target** is copied, as an
ordinary row with no series. That is a series that stopped short of the month —
the rent entered for the year — and "the same as last month" is what was asked
for. The first version left every series row out, on the reasoning that a series
writes its own occurrences. That was wrong for exactly this case: the series had
nothing in the new month, so nothing wrote them, and the rent was missing. The
cost of the new rule is that an installment which really ended is copied too, and
one deleted row fixes it.

The copy carries no series. Attaching it to the old one would mean extending
`ends_on` and risking the unique index on `(recurring_series_id,
occurrence_date)`, for a row that is easy to make recurring again by hand.

## Consequences

- Anything that writes to a month from a job must bump the `Ledger::Transaction`
  stamp itself (`Cache.bump`). A controller does it after a write; a job has no
  controller.
- `docker-compose` and local `rails s` run jobs on the in-process default
  adapter. Setting `SOLID_QUEUE_IN_PUMA` locally runs the real thing.
- The destination picker offers the twelve months after the source. Copying
  backwards is possible through the API and not offered by the app.
