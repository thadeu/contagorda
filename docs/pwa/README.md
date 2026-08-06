# The sheets

Four components and the rules they share. Written down because the rules were
expensive: each was found by installing the app on a phone and finding it behave
differently from every browser it had been tested in.

| Component | What it is | Page behind |
|---|---|---|
| [`BottomSheet`](bottom-sheet.md) | Interrupts with a short list of choices | Covered, unavailable |
| [`Modal`](modal.md) | Presents a task with fields | Covered, unavailable |
| [`ConfirmSheet`](confirm-sheet.md) | Asks before something cannot be undone | Covered by whatever is under it |
| [`DockedSheet`](docked-sheet.md) | Is the bottom half of a screen | Visible and usable |

Start with **[ADR 0003](../decisions/0003-sheet-gestures-on-ios.md)**. It holds
what all four have to do about gestures, scrolling and the safe areas, and why
each rule is not negotiable. The component docs assume it.

## The short version

Declare gestures before they start with `touch-action`; cancelling afterwards is
always too late, because a drag has to travel a few pixels before it can be told
from a tap and iOS has decided by then.

Never lock the document. Both textbook ways of doing it — `overflow: hidden` and
a fixed body — bring back a band along the bottom edge of the installed app, and
one of them does not stop a finger anyway.

Keep scrollers a pixel off their own boundaries, or the browser hands the
gesture to whatever is behind them.

What is drawn is a hint; the target is whatever a thumb can reach.

## If this becomes a library

The four differ in what they are for, not in how a finger moves them. The
gestures belong in one hook before this is extracted — each component currently
keeps its own copy, and that has already cost a bug that reached a phone.
