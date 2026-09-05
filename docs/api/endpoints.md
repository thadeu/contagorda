# What the PWA needs from the API

Every screen in the app runs on mocked data today. This is the inventory of what
has to exist for that mock to be replaced, written from the client's side: what
each component asks for, what it sends, and what it must get back.

`apps/pwa/src/services/ports.ts` is the contract in code, and it is the thing to
keep honest — this document explains it and turns it into HTTP. If the two ever
disagree, the port is right and this is stale.

## What is true of every request

**Base** `https://api.contagorda.com/api/v1`, JSON in and out.

**Auth** `Authorization: Bearer <access token>`. The token identifies a person;
it does not say which ledger they are working in.

**The ledger is a header,** `X-Ledger-Id: <uuid>`, set once by the client from
the active ledger. It is not a path segment and not a query parameter, which is
deliberate: nothing in the app takes a ledger as an argument, so no screen can
pass the wrong one. The server scopes every query by it and by the caller's
membership — a valid id someone is not a member of is a 404, never a 403, since
saying "not yours" confirms it exists.

**Ids are uuidv7** and are the only identifiers that cross the wire. No
sequential id is ever serialised.

**Money is `*_cents`, an integer.** Never a float, never a formatted string, and
never a currency symbol — the client formats.

**Dates are `YYYY-MM-DD`, months are `YYYY-MM`, timestamps are ISO 8601 UTC.** A
month is a string and not a pair of dates; the client never sends a range it
computed.

**Keys are snake_case,** matching the types in `services/types.ts` exactly.

**Writes are idempotent by key.** `Idempotency-Key: <uuid>` on every POST that
creates something. A phone on a bad connection retries, and the one thing this
app must never do is enter a transaction twice.

**Errors** are `{ "error": { "code": "...", "message": "..." } }` with the
message already in pt-BR — a client that translates codes is a client that has to
be redeployed to fix a sentence.

---

## Components and what they need

### Dashboard

| Component | Needs | Endpoint |
|---|---|---|
| `MonthStack` | This month's total, paid and outstanding | `GET /months/:month/summary` |
| `MonthPicker` | Which months hold anything | `GET /months` |
| `SpendingCard` | The month's transactions, grouped by day | `GET /transactions?month=` |
| `TotalBalance` | Every account, plus what each held at the start of the month | `GET /accounts`, `GET /accounts/opening_balances?month=` |
| `AccountsButton` | Account count | `GET /accounts` |
| `ProfileButton` | The name to greet | `GET /me` |
| `MonthList` | The same month's rows | `GET /transactions?month=` |
| `SearchDock` | Narrows the month already loaded, in memory | none — `GET /search?q=` exists for a search across months |
| `FilterSheet` | Categories, to filter by | `GET /categories` |

### History (Stats)

| Component | Needs | Endpoint |
|---|---|---|
| `MonthBars` | One row per month with its totals, oldest first | `GET /monthly_totals` |
| `CategoryFilter` | The month's rows, to build the chips from | `GET /transactions?month=` |
| The figure and the list | Same month, narrowed by category | `GET /monthly_totals?category_id=`, `GET /transactions?month=` |

### Transaction form and sheet

| Component | Needs | Endpoint |
|---|---|---|
| `TransactionForm` | Accounts and categories to choose from | `GET /accounts`, `GET /categories` |
| — creating | Writes one row, or a whole series | `POST /transactions` |
| — editing | Writes one row or the ones after it | `PATCH /transactions/:id` |
| `RecurrencePicker` | Nothing — the rule is computed client-side and sent | — |
| — on an existing row | Turns a single row into a series | `POST /transactions/:id/recurrence` |
| `TransactionSheet` | Marking paid, deleting | `PUT /transactions/:id/settlement`, `DELETE /transactions/:id` |
| `CategoryPicker` / `CategorySheet` | The list, and creating by name | `GET /categories`, `POST /categories` |
| `CategoryFormSheet` | Renaming, re-iconing, deleting | `PATCH /categories/:id`, `DELETE /categories/:id` |
| `AccountPicker` | The list | `GET /accounts` |

### Accounts

| Component | Needs | Endpoint |
|---|---|---|
| `AccountsSheet` | Every account | `GET /accounts` |
| `AccountForm` | Creating and editing | `POST /accounts`, `PATCH /accounts/:id` |
| `AccountEditor` | Archiving | `POST /accounts/:id/archive` |
| Opening balance | Reading and setting, per month | `GET /accounts/opening_balances?month=`, `PUT /accounts/:id/opening_balances/:month` |

### Ledgers

| Component | Needs | Endpoint |
|---|---|---|
| `ActiveLedgerProvider` | Every ledger the person belongs to | `GET /ledgers` |
| `LedgerSection` | Members and pending invites | `GET /ledgers/:id/members`, `GET /ledgers/:id/invites` |
| — inviting | Mints a link | `POST /ledgers/:id/invites` |
| — revoking | Kills a link | `DELETE /invites/:id` |
| — removing someone | Takes access away | `DELETE /ledgers/:id/members/:member_id` |
| `InvitePage` | Claims a link | `POST /invites/:token/accept` |
| Profile sheet | Reading and setting a display name | `GET /me`, `PATCH /me` |

---

## The endpoints

### Transactions

#### `GET /transactions?month=YYYY-MM`

The rows of one month, any order — the client groups and sorts.

```json
[
  {
    "id": "019fce02-...",
    "account_id": "019fce00-...",
    "category_id": "019fce01-...",
    "kind": "expense",
    "amount_cents": 520000,
    "date": "2026-08-05",
    "description": "Aluguel",
    "paid_at": "2026-08-05T12:00:00Z",
    "recurring_series_id": "019fce03-...",
    "created_by_id": "019fce00-...",
    "detached": false
  }
]
```

`paid_at` is a timestamp and not a boolean, because when something was settled is
a fact worth keeping and "true" throws it away. `created_by_id` is stamped by the
server from the authenticated membership and is rejected if the client sends it.

#### `GET /search?q=<text>`

Rows whose description contains the term, across every month and every status,
newest first, capped at 50. Same shape as `GET /transactions`. Accents and case
are set aside on both sides — `farmacia` finds `Farmácia` — by matching on a
stored `folded_description`, the same device categories use. A blank term
answers `[]`. Cached under the folded term and retired by any write to
transactions, like every other read over them.

The month view does not call this: it filters the month it already holds, which
is instant and costs nothing. The route is the seam for a search across months —
a client that does call it must send the term only once typing has paused,
never per keystroke.

#### `GET /months`

Every month holding at least one row, newest first: `["2027-12", "2027-11", …]`.

Built server-side rather than guessed as a range in the client, which would
either hide months that exist or offer empty ones that lead nowhere.

#### `GET /months/:month/summary`

```json
{
  "month": "2026-08",
  "income_cents": 2450000,
  "expense_cents": 1653300,
  "net_cents": 796700,
  "upcoming_cents": 233900
}
```

`net_cents` is signed and computed by the server. The client never derives a
direction it could get wrong; `upcoming_cents` is what is unpaid and still ahead.

#### `GET /monthly_totals?category_id=<uuid|null>`

Oldest first, one row per month that holds anything.

```json
[{ "month": "2026-01", "expense_cents": 1570600, "income_cents": 2450000 }]
```

This is the history chart's whole payload. Its size is months, not transactions,
which is the only reason the screen survives ten years of imported statements.

The category narrows the **aggregate**, not the result — filtering a finished
total on the client is impossible, and fetching every transaction to keep the
breakdown gives up the one property this call has.

#### `POST /transactions`

```json
{
  "account_id": "019fce00-...",
  "category_id": null,
  "kind": "expense",
  "amount_cents": 520000,
  "date": "2026-08-05",
  "description": "Aluguel",
  "paid": true,
  "recurrence": { "frequency": "monthly", "interval": 1, "repeats": 11 }
}
```

`recurrence` is optional. When present the server materialises the whole series
and returns the **first** row. The client sends the rule and never the dates: they
are derived, and two clients deriving them can disagree — see
[ADR 0001](../decisions/0001-recurrence-dates.md) for the anchoring and the
month-end clamp the server has to implement.

`repeats` counts repetitions **after** the first, so `11` is twelve rows.

Only the first occurrence may be paid, whatever `paid` says. A future row marked
settled is a claim about a month nobody has lived through.

#### `PATCH /transactions/:id?scope=one|future`

Any subset of the creation fields. `scope` defaults to `one`.

`future` means this row and the ones after it in the same series. **The past is
never touched** — a reconciled month does not change because a rule did — which is
why there is no `all`.

A row with `detached: true` is skipped by a `future` edit and keeps its own
values. Somebody who corrected March did it knowing March differed.

#### `DELETE /transactions/:id?scope=one|future`

Same two scopes, same rule about the past. `204`.

#### `POST /transactions/:id/recurrence`

Turns a row that belongs to no series into the first of one. Body is the
recurrence object. `409` if the row is already in a series — the honest way to
reach those is the scope choice on an edit.

The row itself is untouched, including whether it was settled; what follows is
new and unpaid.

#### `PUT /transactions/:id/settlement`

`{ "paid": true }` → the updated row. Separate from `PATCH` because it is the one
write the list fires with a single tap, and because "mark paid" and "edit" have
different permissions ahead of them.

### Accounts

#### `GET /accounts`

```json
[{ "id": "…", "name": "Nubank", "kind": "checking", "institution": "Nu Pagamentos", "archived_at": null }]
```

`kind` is one of `checking · savings · credit_card · cash · investment`.
Archived accounts are returned; the client hides them and still needs them to
label old rows.

#### `POST /accounts` · `PATCH /accounts/:id`

`{ "name": "...", "kind": "...", "institution": null }` → the account.

#### `POST /accounts/:id/archive`

`204`. Never a delete: the transactions pointing at it are financial history, and
erasing where something happened makes the row a lie.

#### `GET /accounts/opening_balances?month=YYYY-MM`

```json
{ "019fce00-...": 1250000, "019fce00-...b": -32000 }
```

Keyed by account id. **A missing account is zero, not an error** — an account that
has not been opened for that month is a new account.

A balance belongs to a month, not to an account. One number for an account's
whole life is right until the second month arrives, and then everything derived
from it is wrong in a way nobody can see. `accounts.initial_balance_cents` has to
go.

#### `PUT /accounts/:id/opening_balances/:month`

`{ "cents": 1250000 }` → `204`.

### Categories

#### `GET /categories`

```json
[{ "id": "…", "name": "Mercado", "kind": "expense", "icon": "🛒", "color": null }]
```

#### `POST /categories`

`{ "name": "Farmácia", "kind": "expense", "icon": "💊" }` → the category, created
or matched.

**Matching is on `unaccent(lower(name))`, with the unique index built on the same
expression.** Creating from the transaction form is the main path: typing
"Farmácia" twice must reuse the category, and in Portuguese the accent is the
first thing to go when someone types quickly. Without the index the race between
two phones produces the duplicate the match was written to prevent.

`icon` applies only on creation. A match keeps the icon it has — the name is the
identity, and a different emoji on a second entry is a preference, not a
correction to everything filed under it before.

#### `PATCH /categories/:id` · `DELETE /categories/:id`

Rename and re-icon; delete leaves the transactions and nulls their
`category_id`. Deleted rather than archived: an account is archived because a
transaction has to have happened somewhere, but a row with no label is still
true, just less useful.

### Ledgers

#### `GET /ledgers`

```json
[{ "id": "…", "name": "Casa", "member_count": 2, "role": "owner" }]
```

Never empty — signing up creates one. `role` is **the reader's** role, which is
why it is answered here and not derived: the same ledger is owned by one person
and joined by another.

#### `POST /ledgers` — `{ "name": "..." }` → the ledger.

#### `GET /ledgers/:id/members`

```json
[{ "id": "…", "name": "Thadeu", "email": "…", "role": "owner" }]
```

The `id` is the **membership** id, not the person's — it is what
`created_by_id` points at, and it is the only id the client should ever hold for
another human.

#### `DELETE /ledgers/:id/members/:member_id`

`204`. The owner cannot be removed, and you cannot remove yourself here — leaving
is a different act with a different confirmation, and conflating them is how a
ledger ends up with nobody in it.

#### `GET /ledgers/:id/invites` · `POST /ledgers/:id/invites`

```json
{ "id": "…", "token": "…", "expires_at": "…", "revoked_at": null, "accepted_at": null }
```

Only an owner may create one. **The token is minted by the server**, at least 32
bytes from a CSPRNG, and stored as a digest — see
[ADR 0002](../decisions/0002-server-minted-secrets.md). The client generating it
was a mock convenience and must not survive: a browser-generated token is only as
unguessable as whatever entropy the browser had, and on a page served over
plain http it has none at all.

`token` is returned **once**, in the response that created it. On listing it is
`null`.

This is where the two halves of this document disagreed until the API was
written, and the ADR won. A digest is a one-way function: an invite the server
can read back to the screen is an invite the server is storing in the clear, and
then a leaked table hands over working invitations. So the invite screen shows
the link at the moment it is minted and offers to mint another — which is also
the safer thing to do with a link somebody may have already sent to the wrong
person.

The invite carries no email address. Tying it to one locks out anyone who signs
in with a different address — which is most people, since the address you type is
rarely the one their Google account carries — and there is no way to repair it
afterwards.

#### `DELETE /invites/:id` — revoke. `204`.

#### `POST /invites/:token/accept`

Returns the ledger. `410` when expired, revoked or already accepted, each with
its own message.

### Profile

#### `GET /me` · `PATCH /me`

```json
{ "display_name": "Thadeu" }
```

`null` means the person has not chosen one and the identity provider's name
stands. Storing a copy of that name would freeze it: change it at the provider
and the app greets you by the old one forever, with no way to tell a stale copy
from a deliberate choice.

`/me` should grow the viewer's **membership id** in the current ledger, so the
app can render "Você" instead of the person's own name beside a row they entered.
Nothing answers that today.

---

## What the schema had to change

Recorded as they were found while the front end was built, and all of them done
now. Three landed differently from how they were written down, and the
difference is the interesting part.

1. **`ledger_id` replaces `user_id`** on accounts, categories and transactions.
   `ledgers`, `ledger_memberships` and `ledger_invites` added. ✅
2. **Opening balance per account per month,** in `account_opening_balances`.
   `accounts.initial_balance_cents` is gone. ✅
3. **Invite tokens ≥ 32 bytes, stored as a digest,** minted by the server. ✅
4. **`monthly_totals` as a real aggregate.** ✅ — `GROUP BY date_trunc('month',
   date), kind`, with `category_id=none` for the rows nobody labelled.
5. **`created_by_id` stamped server-side** from the authenticated membership. ✅
6. **Category names folded past the accent — but in a stored column, not an
   expression index.** `unaccent()` is declared STABLE and cannot be indexed
   without a custom immutable wrapper, and a function is exactly what
   `schema.rb` cannot carry: the test database would load an index with nothing
   to call. Switching the whole app to `structure.sql` for one function needs a
   `pg_dump` that matches the server, which the development machine does not
   have. So `categories.folded_name` is written by the model and carries a plain
   unique index. `Ledger::Category.fold` is the one place the rule lives.
7. **`recurring_series` plus `detached`.** ✅ — **and no job.** The client's rule
   is counted (`repeats`), not open-ended, so a series is finite and is written
   in one transaction at creation. There is no rolling window to extend, and
   therefore no cron that can fall behind without anyone noticing.
8. **A "who am I" answer.** ✅ — `/me` returns `membership_id`, the reader's
   membership in the ledger named by the header.
9. **`Idempotency-Key` honoured** on every creating POST. ✅ — first call stores
   its response in `idempotency_keys`, retries replay it, and the same key on
   another route is a 409 rather than someone else's body.

## What the client does

`services/http.ts` adds everything that is true of every call, so a port is a
URL and a shape and cannot forget a header.

- **`AbortSignal` reaches `fetch`.** Every read carries one and hands it on.
- **Writes take no signal, on purpose.** A write that has left cannot be
  recalled, only ignored — which is what the idempotency key is for.
- **`X-Ledger-Id` is read at call time,** from `getActiveLedgerId()`. A value
  captured at import would keep answering for the ledger the app opened on.
- **`Idempotency-Key` on the writes that create,** a fresh uuid per call.
- **Query keys carry the ledger,** and switching clears the cache.
- **The error message is shown as it arrived.** The server writes it in pt-BR;
  a client that turned codes into sentences would need a release — and on iOS a
  review — to fix a word.

`VITE_USE_MOCK=true` runs the whole app on fixtures instead, which is what the
UI tests do: `.env.test` declares it rather than relying on a variable being
absent.
