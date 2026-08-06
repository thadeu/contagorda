# DockedSheet

A sheet that opens with the screen and never closes.

`src/ui/DockedSheet.tsx`

## When to use it

When a screen is two things at once and both stay useful: a chart with the list
behind it, a map with the results. The statistics view is the only user today —
the chart is why the screen exists, and the list is what you pull up when a
figure raises a question.

The distinction from `BottomSheet` is the whole design: this one is not over the
page, it *is* the bottom half of the screen. No backdrop, no dismissal, no scroll
lock, because what is above it stays usable the entire time. Every part of a
`BottomSheet` assumes the opposite.

## Shape

```tsx
<DockedSheet expanded={expanded} onExpandedChange={setExpanded} toolbar={<CategoryFilter …/>}>
  {groups.map(…)}
</DockedSheet>
```

| Prop | What it is for |
|---|---|
| `expanded` | Which of the two detents it rests at, owned by the screen. |
| `toolbar` | Stays under the handle while the list moves. Controls over the list. |

## Rules it encodes

**It starts small.** 38% of the screen. The chart is the subject; opening
half-covered answers a question nobody has asked yet.

**It reaches the bottom edge, always.** Anchored to the bottom of the frame
rather than sized to a share of it, so a strip of page can never appear
underneath. It was a flex sibling first, splitting the height into two blocks —
that read as two screens stacked and left the chart without the room to be a
chart.

**It is lighter than the page, not darker.** The opposite of `BottomSheet`, and
not a contradiction: an overlay covers the page, so it drops; this is the raised
half of a screen whose background was dropped to let it rise. Same word,
opposite direction, which is why they are different tokens — `--color-surface`
here, `--color-overlay` there.

**The height follows the finger.** Driven live and held between the detents by
`clamp`, so pulling past either end stops instead of overshooting and springing
back.

**The grab area includes the toolbar**, and the toolbar is a horizontal
scroller — so the first few pixels decide the axis, and the decision holds for
the rest of the gesture. Re-deciding mid-drag is how a sheet jumps while someone
is reading a row of filters.

## Traps

- The toolbar needs `touch-action: pan-x`. A horizontal scroller nested in a
  vertical one has its gesture read as vertical, and dragging the chips drags the
  sheet.
- The handle needs `touch-action: none`, like every other draggable surface here.
- Do not give it a backdrop "for consistency". The page behind is meant to be
  read while this is open; dimming it would be saying the opposite.

## Related

`useDragLock`, `useEnter`. ADR `0003-sheet-gestures-on-ios`.
