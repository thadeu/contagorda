# Theme

Two palettes, one attribute.

`src/app/theme.ts` · `src/ui/ThemeSwitch.tsx` · `src/styles/tokens.css`

## How it works

`tokens.css` defines the light palette at `:root` and repoints the semantic
tokens under `html[data-theme='dark']`. Nothing else in the app knows which theme
it is in: a component asks for `bg-surface` and gets whichever surface is
current.

```css
:root { --color-surface: #ffffff; --color-ink: #0a0f1a; }
html[data-theme='dark'] { --color-surface: #151922; --color-ink: #f2f5f9; }
```

That is the whole mechanism, and it only works because the tokens are named after
their job. A palette of `--color-blue-500` would need every component edited to
switch anything.

## Rules it encodes

**It applies before React.** `applyStoredTheme()` runs in `main.tsx`, above the
render. The document ships marked dark, so a light-theme user would otherwise
watch the dark palette paint and then swap — and the swap is the whole screen,
not a detail of it.

**It is a device preference, not a profile field.** `localStorage`, not the API.
It belongs to the phone in your hand; syncing it through the ledger would mean a
theme changing under one person because the other switched.

**The store lives outside React.** The thing being changed is an attribute on
`<html>`, above the root the app mounts into. A context would let the value and
the document disagree, and the document is the one that decides what anybody
sees. `useSyncExternalStore` is the bridge.

**`theme-color` follows.** Without it the browser's own chrome — the address bar
in a tab, the strip behind the clock in the installed app — keeps the colour from
the document head and frames a light app in a dark border.

**Two states, not three.** "Follow the system" is the more thoughtful option and
the harder one to look at: the control shows neither sun nor moon as chosen, or
shows one without having been touched. If it earns its way in, it is a third
segment rather than a different control.

**A segmented control, not a toggle.** A toggle has an on and an off, and neither
theme is the app being switched off.

## What a second theme actually costs

Not colours — relationships. Three things had to change beyond the palette, and
each was a place where one token had been doing two jobs that only agreed in the
dark:

**`--color-fill` split from `--color-accent`.** The accent marks things (a chosen
month, a spinner), where it has to be bright against the page, and fills things,
where it carries text on top. A pale blue with white text is the least readable
button in the app, so the light theme fills with a near-navy and keeps the bright
blue for marking. The dark theme has the opposite need — near-black on near-black
is how the add button went missing once — so `--color-fill` points at the accent
there.

**`solid` on `NavButton`.** The quiet chip is `bg-sunken`, a step *down* from a
white surface. On the history screen the page is already that step, so the two
landed on nearly the same grey and the controls vanished. `solid` paints them
with the raised dark instead — a step in a direction the page has not taken.

**`--color-deep` reversed direction.** For one afternoon it was white, and the
screen lost its floor: panel, cards and page were all one white, and the chart,
which has no border or shadow of its own, stopped being on anything. The dark
theme never had that problem because its page is the deepest thing on screen. So
the light theme keeps the same grammar with the tones reversed — the page
recedes, the panel rises by being lighter.

## Traps

- **`bg-white/12` is not a theme-aware colour.** It is right on a dark card in
  both themes and wrong the moment the surface under it is light. The lit column
  on the history chart was invisible in the light theme for exactly this reason;
  `bg-ink/[0.06]` means "a little of the text colour", which is what "lit" was
  trying to say.

- **A theme flip finds every hardcoded hex.** Grep for `#`, `white/` and `black/`
  before declaring one done. The ones that survive are the ones sitting on a
  surface that is dark in both themes, and they are correct.

## If this becomes a library

The switch and the store are twenty lines each and carry nothing app-specific.
What is worth taking is the discipline underneath: every colour named for its
job, no component branching on the theme, and the flip done by repointing tokens
rather than by toggling classes. Everything above happened without a single
component learning which theme it was in.
