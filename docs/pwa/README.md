# The components

The four sheets and the rules they share. Written down because the rules were
expensive: each was found by installing the app on a phone and finding it behave
differently from every browser it had been tested in.

| Component | What it is | Page behind |
|---|---|---|
| [`BottomSheet`](bottom-sheet.md) | Interrupts with a short list of choices | Covered, unavailable |
| [`Modal`](modal.md) | Presents a task with fields | Covered, unavailable |
| [`ConfirmSheet`](confirm-sheet.md) | Asks before something cannot be undone | Covered by whatever is under it |
| [`DockedSheet`](docked-sheet.md) | Is the bottom half of a screen | Visible and usable |

And the pieces that are not sheets:

| Piece | What it is |
|---|---|
| [`Spinner`](spinner.md) | Marks a value as being checked, without taking it away |
| [`AmountField`](amount-field.md) | Takes a sum of money the way a till does |
| [`Theme`](theme.md) | Two palettes behind one attribute |

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

A portal moves the node, not the events: React dispatches through the component
tree, so a form opened from inside another form submits both unless it stops.

What is drawn is a hint; the target is whatever a thumb can reach.

A skeleton is right for a screen that has never been filled and wrong for every
load after that. Keep the last answer and mark it instead — see
[`Spinner`](spinner.md).

Money is entered from the right, without a separator and without a caret. The
caret is the part people notice — see [`AmountField`](amount-field.md).

Colours are named for their job, so a whole theme is one attribute and no
component ever learns which one it is in — see [`Theme`](theme.md).

There are no haptics on iOS. `navigator.vibrate` is Android-only, and the
switch-checkbox trick does not fire from script — tested on the device. Never let
anything be communicated by feel alone.

## If this becomes a library

The four differ in what they are for, not in how a finger moves them. The
gestures belong in one hook before this is extracted — each component currently
keeps its own copy, and that has already cost a bug that reached a phone.
