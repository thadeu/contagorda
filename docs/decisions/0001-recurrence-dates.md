# Recurrence dates are computed from the anchor, never chained

## Context

A monthly series starting on the 31st has no 31st in February. Something has to
give, and the choice shows up in every month after it.

ActiveSupport already does the sensible thing: `Date.new(2026,1,31) + 1.month`
is `2026-02-28`. It clamps to the last day of the month rather than overflowing
into March. That matches how real bills behave — rent, subscriptions and card
statements land on the last day when the chosen day does not exist — and it
means no month silently loses the expense.

So there is no `day_rule` column. The behaviour is "clamp to end of month", and
it comes free.

## The trap

The clamping is only correct if every occurrence is computed **from the series
anchor**. Chaining from the previous occurrence collapses the day permanently:

```ruby
anchor = Date.new(2026, 1, 31)

anchor + 0.months  # 31/01
anchor + 1.month   # 28/02
anchor + 2.months  # 31/03   ← recovers
anchor + 3.months  # 30/04

# but:
d = anchor
d += 1.month       # 28/02
d += 1.month       # 28/03   ← lost the 31st for good
d += 1.month       # 28/04
```

Both start identically, which is what makes this easy to ship and hard to
notice: the bug only appears from the third occurrence onward, and only for
series anchored after the 28th.

## Decision

Occurrence *n* is always `series.starts_on + (n * interval).months` (or
`.weeks`, `.years`). No occurrence is ever derived from the one before it.

Materialisation is therefore idempotent — recomputing a window produces the same
dates — and extending the window later cannot drift from what was already
written.

## Consequences

A spec must cover a series anchored on the 31st across at least four months. The
first two occurrences are identical under both approaches, so a test that stops
at February proves nothing.
