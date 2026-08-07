import { useRef, type ChangeEvent } from 'react'
import { digitsToInput } from '@/lib/money'

/**
 * The reason the form was opened, and the only thing on it that looks like it.
 *
 * Digits fill from the right — `5` is five cents, `50760` is five hundred and
 * seven sixty — so the separator is never typed and the caret is never placed.
 * See `digitsToInput`: a free text field asks for a decimal on a keyboard that
 * offers both a comma and a full stop, and then asks which side of it the caret
 * is on.
 *
 * Which is why the caret is hidden. There is only one place a digit can go, so a
 * blinking line above a forty-pixel number is announcing a choice nobody has —
 * and at that size it is not a hairline, it is a bar flashing over the figure.
 * Every touch sends it back to the end, so it cannot be stranded in the middle
 * of a number where the next keystroke would land somewhere surprising.
 *
 * `inputMode="numeric"` and not `decimal`: with cents filling from the right the
 * separator key is dead weight, and a keypad without it is a keypad with fewer
 * ways to go wrong.
 *
 * The field grows with the number rather than reserving room for the largest one
 * anybody could enter. A fixed width leaves `R$` marooned at the far left of an
 * empty box — which is what it did — instead of sitting against the figure where
 * it reads as part of it.
 */
export function AmountField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const field = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(digitsToInput(event.target.value))
  }

  function toEnd() {
    const input = field.current

    if (!input) return

    const end = input.value.length

    input.setSelectionRange(end, end)
  }

  return (
    <div className="flex items-baseline justify-center gap-1.5 pt-1">
      <span className="text-xl font-medium text-faint">R$</span>

      <input
        ref={field}
        value={value}
        onChange={handleChange}
        onFocus={toEnd}
        onSelect={toEnd}
        inputMode="numeric"
        placeholder="0,00"
        aria-label="Valor"
        size={Math.max(value.length, 4)}
        className="tnum w-auto min-w-0 caret-transparent bg-transparent text-[2.5rem] leading-none font-bold tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
      />
    </div>
  )
}
