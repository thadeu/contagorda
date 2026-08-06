# Modal

A task presented over the app, not a place you travel to.

`src/ui/Modal.tsx`

## When to use it

Something with fields: a new transaction, an account, the list of accounts. It
takes most of the screen, keeps a strip of the page visible at the top, and ends
where it started.

The alternative was a route, and it said the wrong thing. Creating a transaction
is a few seconds of work; a route puts that in the address bar, gives it a back
button, and asks the person to navigate their way home. Everything that used to
be a form route in this app is now a `Modal`, which is also what let the tab bar
go — it had ended up holding one tab that led where you already were.

## Shape

```tsx
<Modal
  title="Novo lançamento"
  onClose={close}
  trailing={<NavButton type="submit" form={FORM_ID} icon={CheckIcon} label="Salvar" />}
>
  <TransactionForm id={FORM_ID} onSubmit={…} />
</Modal>
```

| Prop | What it is for |
|---|---|
| `title` | Centred, between the close button and the action. |
| `trailing` | The screen's own action, opposite close. |
| `onClose` | Called by the backdrop, the close button, and a downward drag. |

## Rules it encodes

**Saving lives in the nav bar, wired by `form`.** The submit button sits outside
the `<form>` element and reaches it by id, which HTML supports and which avoids
lifting form state into the modal. A full-width button under a divider is a web
page's footer, and it took a strip of the panel for something that is one tap
either way.

**The panel bleeds below its own bottom edge.** A `position: fixed` box is inset
by the safe areas in the installed app, so a panel meant to meet the bottom of
the screen stops short and the dimmed page shows through as a band. The backdrop
solves this for itself with a negative inset; the panel cannot, because a
negative inset would move the content inside it — so it gets a strip of its own
colour below.

**It is one height.** A form needs as much room as it needs, up to nearly the
screen; there is no second detent, because there is nothing to reveal by pulling.
That is the clearest line between this and `BottomSheet`.

**It nests.** Accounts opens a `Modal`, its form opens over that, a confirmation
over that. Nesting is what forced the scroll lock to be counted rather than
flagged — with a boolean, the innermost closing unlocks the page while two are
still covering it.

## Traps

- **The grab area needs `touch-action: none`.** This component shipped without
  it after a refactor rewrote the header for the `trailing` slot, and the symptom
  was the dashboard sliding down behind the panel while the panel followed the
  finger. Nothing in a test can see it.
- The content scroller is long here, so it is `pan-y` rather than `none`, which
  means boundary chaining is live: the scroller is nudged one pixel off its edge
  before a gesture starts. See ADR 0003, decision 2.
- Portalled to `#root`, not the body. See ADR 0003, decision 5.

## Related

`NavBar`, `ConfirmSheet`, `useTouchScrollGuard`, `useScrollable`, `Portal`.
ADR `0003-sheet-gestures-on-ios`.
