# AmountField

Taking a sum of money on a phone.

`src/features/transactions/components/AmountField.tsx` ·
`digitsToInput` in `src/lib/money.ts`

## The rule

Digits fill from the right, the way a till does.

| Typed | Shown |
|---|---|
| `5` | `0,05` |
| `50` | `0,50` |
| `507` | `5,07` |
| `50760` | `507,60` |
| `123456` | `1.234,56` |

Nobody types a separator and nobody places a caret. The only two things that can
happen are another digit and a backspace.

## Shape

```tsx
<AmountField value={values.amount} onChange={(amount) => set('amount', amount)} />
```

The value it holds is the formatted string — `"1.234,56"` — so whatever parses it
on the way out (`parseBRLToCents`) is the same function that parses anything else
in the app. The digits are an implementation detail of typing, not a second
representation of money to keep in step.

## Rules it encodes

**Fill from the right, always.** A free text field asks for a decimal on a
keyboard that offers both a comma and a full stop and accepts either, then asks
which side of it the caret is on. `1.234,5` is a plausible thing to be left
holding when a thumb lands slightly wrong, and it is wrong by a factor of ten.

**No caret.** There is one place a digit can go, so a blinking line announces a
choice nobody has. At the size a headline amount is set — forty pixels — it is not
a hairline either; it is a bar flashing over the figure, which is what got this
rewritten. `caret-transparent`, and every focus and select sends the position
back to the end so it cannot be stranded mid-number where the next keystroke
would land somewhere surprising.

**`inputMode="numeric"`, not `decimal`.** With cents filling from the right the
separator key does nothing. A keypad without it is a keypad with fewer ways to go
wrong.

**It is still an `<input>`.** The system keyboard, selection, autofill, the
accessibility tree and every hardware keyboard behaviour come free. A `<div>`
with key handlers reimplements all of that and gets some of it wrong on a device
nobody tested.

**The field grows with the number.** A width reserved for the largest amount
anybody could enter leaves the `R$` marooned at the far left of an empty box —
which is exactly what it did — instead of sitting against the figure where it
reads as part of it.

**Leading zeros are dropped.** They are what a backspace leaves behind, and
without this they accumulate: `0,05` backspaced to `0` and typed again gives
`00,05` on the next keystroke.

**There is a ceiling**, at `R$ 999.999.999,99`. Not a validation rule — a limit on
how many digits can be accumulated at all, so a thumb resting on a key cannot
produce a number no layout was built for.

## Traps

- **Do not reformat on blur.** The value is already formatted on every keystroke;
  a second pass on blur is a second implementation, and the day they disagree the
  amount changes when the field loses focus.

- **Do not store the digits and the formatted value separately.** One of them
  becomes the truth and the other becomes a cache, and the cache is what the form
  submits at the worst possible moment.

- **`size` is not `width`.** The field is sized by the `size` attribute rather
  than by CSS because `field-sizing: content` is not in Safari, and Safari is the
  browser this app runs in.

## If this becomes a library

`digitsToInput` is the whole idea and it is nine lines. It carries the locale
with it through `Intl`, so the same function serves any currency that has two
decimal places — which is most of them, and the ones that do not (yen, dinar)
need the divisor to come from the currency rather than being hardcoded to a
hundred.
