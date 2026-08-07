# 0003 — Sheets and gestures in an installed PWA

## Status

Accepted, and paid for. Every rule below is written down because breaking it
produced a bug that shipped to a phone and took a while to find.

## Context

The app presents almost everything in sheets: transactions, accounts,
categories, the profile, confirmations. On the web they behaved perfectly from
the first attempt. Installed on iOS they did not, and the failures were of a
kind that green tests and a desktop browser cannot show — the page creeping
behind an open panel, a strip of background along the bottom edge, a button that
responded only under a four-pixel line.

What follows is the set of rules that came out of fixing them, and the reasoning
each one is standing on. They are not iOS trivia; they are what a sheet has to
do to feel native, stated as decisions.

## Decisions

### 1. Declare the gesture before it starts, do not cancel it afterwards

`touch-action` is the mechanism. A guard that calls `preventDefault` on
`touchmove` cannot be the primary defence, because it has to let the first few
pixels through to tell a tap from a drag — cancelling earlier is how every
button inside a sheet stops working, since the click is synthesised from a touch
sequence the page just refused. By the time those pixels have passed, Safari has
claimed the gesture and stopped listening.

So every surface says what it allows before a finger lands:

| Surface | Declaration | Why |
|---|---|---|
| Drag handle / grab area | `touch-action: none` | The panel follows the finger; nothing else may. |
| Panel with nothing to scroll | `touch-action: none` | A gesture with nowhere to go is the one iOS spends on the page behind. |
| Scroller with content | `touch-action: pan-y` | Vertical only: an open horizontal axis lets a diagonal drag reach the page sideways. |
| Backdrop | `touch-action: none` | Same as any other dead area. |
| Horizontal strip inside a sheet | `touch-action: pan-x` | Otherwise its gesture is read as vertical and drags the sheet. |

Whether a scroller has anywhere to go is measured, not assumed — see
`useScrollable`. A sheet that cannot scroll when it opens often can once the list
underneath it loads.

**`touch-action` is intersected down the tree.** Putting `none` on a frame or a
scroller switches it off for everything inside, including the sheet's own list.
This caught the codebase twice: once on the app frame, once on the stats screen.
Declare it on the surface that owns the gesture, never on an ancestor of one.

### 2. Keep scrollers off their own boundary

A scroller sitting exactly at `scrollTop: 0` or at its end is what iOS hands to
the page behind, in the same unrecoverable way. Before a gesture begins, nudge it
one pixel inwards. It always has somewhere to go, so the gesture is never passed
on, and one pixel on an element about to scroll is invisible.

`overscroll-behavior: contain` is supposed to cover this and cannot be relied on
for nested scrollers on iOS. It stays on, as the thing that will eventually make
this unnecessary.

### 3. Never lock the document

Not `overflow: hidden` on `html` or `body`, not `position: fixed` on the body.
Both are the textbook answers and both are wrong here.

The page reaches the bottom edge of the screen by being one status-bar height
taller than the viewport — the spacer ahead of `#root`, see decision 4 — and
sitting scrolled by that much. Freezing the document snaps it back to the top and
hands back a band along the bottom edge, exactly as tall as the status bar. The
symptom looks unrelated to the change that caused it, which is what made it cost
three separate attempts.

`overflow: hidden` on `html` does not stop a finger on iOS anyway. It stops the
scrollbar and it stops `scrollTo`. Locking the document is a trade with no good
side: it costs the band and buys nothing that decision 1 does not already
provide.

The app's own scroller — `main` — is a different matter and is stopped by CSS
while an overlay is open. That is a container, not the document.

### 4. The band, and the spacer that removes it

In `black-translucent` the web view owns the whole screen, and every attempt to
size a frame around the safe areas left a strip along its edges. A plain element
in flow ahead of the root does not. Why is not established; it was found on the
device and is kept in the shape it was found in.

The consequence that matters: the page is deliberately taller than the viewport.
Anything that changes how the document is measured, positioned or scrolled will
bring the band back, and the connection will not be obvious. When it reappears,
suspect the most recent layout or positioning change first, whatever it was
about.

### 5. Overlays live outside the scroller, and no further

Every sheet is written inside the screen that opens it, which puts it inside
`main`. When a scroller inside a sheet reaches its end, the browser walks up the
ancestors looking for the next scrollable thing and finds the page behind,
because it genuinely is one. That is correct behaviour on a wrong tree.

They are portalled to `#root`: out of the scroller, still inside the element the
spacer compensates. Portalling to the body is one step too far and brings back
the band, for the reason in decision 4.

### 6. A portal does not stop an event

React events travel the component tree, not the DOM one, and a portal changes
only the second. A form written inside another form's tree — a category sheet
opened from the transaction form, three portals deep — submits both: the inner
one saves, and its submit event reaches the outer handler on the way past.

Every form that can be reached from inside another calls `stopPropagation` as
well as `preventDefault`. The DOM says they are siblings under `#root`; React
disagrees, and React is the one dispatching.

This is not specific to forms. Any handler on an ancestor component will see
events from a portalled descendant, which is usually what makes portals pleasant
to use and occasionally exactly wrong.

### 7. The lock is counted, not flagged

Sheets nest three deep — accounts, then a form, then a confirmation. With a
boolean, the innermost closing unmarks the page while two are still covering it.
The mark belongs to the last one standing.

### 8. Panels follow the finger

Deciding only on release is a drag where nothing happens and then everything
happens at once: the gesture reads as ignored and the jump at the end reads as a
bug. Height or offset is driven live, `clamp` holds it between detents so
overshooting simply stops, and only the release travels.

Leaving is linear, arriving is not. The arrival curve decelerates because the
panel is settling into a place it will stay; on the way out there is nothing to
settle into, and the same easing makes it hesitate just before it is gone, which
reads as lag rather than as grace.

Closing is also deferred: the parent unmounts the sheet the moment it hears, so
it does not hear until the movement has finished. Without that, the panel is
taken away mid-slide and a dismissal that could have been a drag looks like a
switch being thrown.

Entrances are scheduled with two animation frames — one can still land inside the
same paint on iOS, and the animation is skipped exactly as if nothing had been
scheduled — and animated by the compositor, so a slide costs nothing while a list
renders behind it.

### 9. The grab area is what the finger can reach

The handle is four pixels of drawn line. Anything at the top of a sheet that is
read rather than tapped belongs in the grab area with it: headings, detail rows,
a filter strip. What is drawn is a hint; the target is whatever the thumb lands
on.

## Consequences

Three components implement this — `BottomSheet`, `Modal`, `DockedSheet` — plus
`ConfirmSheet`, which has no gesture at all and still has to declare that. Each
holds its own copy of the rules, and that has already cost a bug: the `Modal`
lost `touch-action` on its grab area during an unrelated refactor and nobody
noticed until a finger found it.

**Before this becomes a library, the gesture belongs in one hook.** The
components differ in what they are for — one interrupts, one presents a task, one
is half a screen — not in how a finger moves them.

## What this is worth

There is no component library that gets this right, because the failures are
invisible in a desktop browser and in jsdom, and only appear in a PWA installed
on a phone. Every rule here was found by someone holding the device.

See `docs/pwa/` for the components themselves.
