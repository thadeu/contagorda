# Spinner

Saying that what is on screen is being checked, without taking it away.

`src/ui/Spinner.tsx`

## When to use it

Beside a value that is already there and about to be replaced. Moving through
months on the history screen is the case it was built for: the chart, the total
and the list all belong to a month, and a month changes with a flick.

Not for a screen that has nothing on it yet — there is nothing to annotate, and
what that screen needs is layout, not a mark. Not for a button that is working
either; a button that cannot be pressed again says so by being disabled, and a
second signal on the same control is noise.

## Shape

```tsx
<p className="flex items-center gap-2.5 text-[2rem] font-bold text-ink">
  {transactions.data ? <Money cents={totalCents} /> : <span className="opacity-0">—</span>}

  {busy && <Spinner />}
</p>
```

`busy` covers every query the value depends on:

```tsx
const busy = transactions.isFetching || totals.isFetching
```

And the queries have to hold their last answer, or there is nothing for the
spinner to annotate:

```tsx
useQuery({ queryKey, queryFn, placeholderData: keepPreviousData })
```

## Rules it encodes

**It annotates, it does not replace.** The figure keeps the month it had until
the new one lands. This is the whole reason the skeleton that came before it was
removed: a skeleton replaces the screen with an outline of itself, and stepping
through twelve months meant twelve blanks. Keeping the last answer makes moving
through months feel like moving rather than like loading.

**Which makes `keepPreviousData` the real mechanism.** Without it there is
nothing on screen to mark as stale, and the spinner is decorating an empty
space. The spinner is the honesty; the retained data is the feature.

**It sits beside the value, never over it.** Over the top is a scrim by another
name, and a value you cannot read is a value that has been taken away.

**It is small and thick.** A hairline ring at this size reads as a smudge and its
rotation is barely visible, which defeats the one thing it is for. `3px` on
`0.62em` turns instead of shimmering.

**Sized in `em`, coloured in the accent.** In `em` it stays in proportion to
whatever text it stands next to, so the same component is right at `2rem` and
right in a list row. In the accent it says the app is working without pretending
to be another number — beside a figure that is the point of the screen, a ring in
the ink colour competes for the same glance.

**It keeps turning under `prefers-reduced-motion`.** Everywhere else in this app
motion is decoration and is dropped on request. Here the movement is the message,
and a still spinner is a glyph that says nothing.

**It carries `role="status"` and a label.** The visual is a rotation, which is
not available to a screen reader at all.

## Traps

- **A blank is not better than a stale value, and a zero is worse than both.**
  On a cold cache there is no previous month to keep, and the temptation is to
  render the figure anyway — it will be `R$ 0,00`. That is a real answer, a month
  with nothing spent in it, and the app would be stating it with a straight face
  on the way to something else. Hold the value back and keep its space:
  `<span className="opacity-0">—</span>` reserves the line so nothing jumps when
  the number arrives.

- **One spinner per value, not one per query.** The total on the history screen
  depends on two requests that are asked separately and land separately. A
  spinner bound to either one alone leaves and comes back, which reads as a
  stutter rather than as loading.

- **`isFetching`, not `isLoading`.** `isLoading` is only true when there is no
  data at all, which is exactly the case this component is not for.

- **Do not fade it in.** It exists for a few hundred milliseconds; a transition
  on the way in means it is still arriving when it should be leaving.

## If this becomes a library

Nothing here is specific to this app except the accent token. The pairing worth
carrying over is not the component but the pattern: retained data plus a small
mark, in place of a skeleton. Skeletons are right when a screen has never been
filled; they are wrong for every subsequent load, and most component libraries
ship only the first half of that.
