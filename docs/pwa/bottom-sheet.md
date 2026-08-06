# BottomSheet

A panel that interrupts. It covers the page, dims it, and closes.

`src/ui/BottomSheet.tsx`

## When to use it

A short list of choices about something the person just pointed at: what to do
with a transaction, which month, which category, who is in this space. It
answers a question and leaves.

Not for a form — that is `Modal`. Not for half a screen that stays — that is
`DockedSheet`. The difference is not size, it is whether the page behind is
available: a `BottomSheet` says it is not, and everything about it follows from
that. Sharing a component between the three would mean a prop for every place
they disagree, all set the opposite way in each.

## Shape

```tsx
<BottomSheet
  title={transaction.description}
  subtitle={formatBRL(transaction.amount_cents)}
  onClose={close}
  actions={<span>28 sex</span>}
  grab={<dl>…</dl>}
  expandable
>
  …
</BottomSheet>
```

| Prop | What it is for |
|---|---|
| `title`, `subtitle` | The heading. What this sheet is about. |
| `actions` | Controls belonging to the sheet, on the title's line. |
| `grab` | Content that is read, not tapped, dragged along with the handle. |
| `expandable` | Adds a taller detent. Only worth it when there is more to see. |
| `onClose` | Called by the backdrop, Escape, and a downward drag. |

## Rules it encodes

**Two detents, and only when they mean something.** `expandable` exists so a long
list can be pulled taller. A sheet holding three actions that grows to fill the
screen is empty space pretending to be content, and the gesture teaches nothing
because nothing changes. Everything else is one height, up to `75dvh`.

**The gesture splits by direction.** Downward moves the whole panel toward being
dismissed; upward grows it, and only when there is a taller detent to grow into.
Both are driven live — a pull that stores up its effect until release reads as a
sheet that ignored you and then jumped.

**The grab area is the whole top.** The handle, the heading, and whatever is
passed to `grab`. A sheet that can only be pulled by four pixels of drawn line
asks for precision the gesture never needed.

**It is darker than the page, not lighter.** `--color-overlay`, which drops in
dark mode rather than rising. Elevation by lightening landed on exactly the
colour of the dashboard cards — tested on a phone, read as one confusing plane —
and the scrim does the lifting instead.

**The scrim bleeds past the frame.** `-inset-y-24`, because a `position: fixed`
box is inset by the safe areas in the installed app and the page shows through
underneath otherwise.

## Traps

- The panel's drag handlers carry `touch-action: none`. Without it the browser
  reads the same downward pull as a scroll and moves the page behind while the
  panel follows the finger. This is exactly the bug `Modal` shipped with after a
  refactor dropped the class.
- The content scroller is measured, and touch is off when it has nowhere to go.
  See `useScrollable`.
- Do not lock the document to stop the page behind. See ADR 0003, decision 3.

## Related

`useBodyScrollLock`, `useTouchScrollGuard`, `useDragLock`, `useScrollable`,
`useEnter`, `Portal`. ADR `0003-sheet-gestures-on-ios`.
