# ConfirmSheet

Asking before something cannot be undone.

`src/ui/ConfirmSheet.tsx`

## When to use it

Archiving an account, removing someone from a space, deleting a category or a
transaction. Anything whose result cannot be recovered from the notice that
follows it.

Not for every destructive-looking action. Marking a transaction paid removes it
from the list being read, which looks drastic and is undone by tapping the
notification that appears — that path needs no question. The test is whether an
answer exists afterwards.

## Shape

```tsx
<ConfirmSheet
  danger
  title={`Excluir ${category.name}?`}
  message="Os lançamentos que estavam nela continuam, sem categoria."
  confirmLabel="Excluir"
  pending={remove.isPending}
  onClose={() => setDeleting(false)}
  onConfirm={() => remove.mutate(category.id)}
/>
```

## Rules it encodes

**The action is named after what it does.** "Excluir", not "OK". A generic word
beside a question is a coin toss for anyone who read the title and not the body,
which is most people most of the time.

**The message answers the hesitation, not the action.** What stops someone is
rarely "what does this button do" — it is "what happens to everything attached to
it". So: the transactions survive without a category; the history stays with the
account it happened in; the value and the date do not change. Say the
consequence, not the operation.

**It cannot fire twice.** `pending` disables the confirming button while the
mutation runs. A double tap on a destructive action is how something gets deleted
twice, and the second one usually finds a different row.

**Tapping away is backing out.** The backdrop closes without acting, and it is
labelled "Fechar" rather than "Cancelar" so a screen reader is not offered two
controls with the same name.

**It does not lock the page.** Whatever is underneath is already a sheet that
did. Locking twice means the first to unmount unlocks for both, and the screen
behind starts scrolling under a panel that is still open.

## Traps

- **The panel needs `touch-action: none` even though nothing here moves.** There
  is no scroller and no drag, so nothing ever declared anything, and every
  gesture landing on it went to the page behind. A component with no gesture of
  its own still has to say so.
- It renders above the sheet that opened it by DOM order rather than a higher
  `z-index`; both portal to the same host, and the one rendered later wins.

## Related

`Button`, `Notice`, `useBodyScrollLock`, `Portal`.
ADR `0003-sheet-gestures-on-ios`.
