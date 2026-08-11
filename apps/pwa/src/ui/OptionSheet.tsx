import { BottomSheet } from './BottomSheet'
import { CheckIcon } from './icons'

export interface Option {
  value: string
  label: string
  /**
   * The quieter line under the label — what kind of thing this is, where it is
   * held. Optional because plenty of lists have nothing to add: an option that
   * repeated its own name in grey would be noise with a smaller font.
   */
  caption?: string
}

interface OptionSheetProps {
  title: string
  options: Option[]
  value: string
  onSelect: (value: string) => void
  onClose: () => void
}

/**
 * Choosing from a list, in the app's own hands.
 *
 * A native `select` on iOS opens a wheel at the bottom of the screen that owns
 * its own typography, its own colours and its own idea of how tall a row is —
 * inside a dark sheet it arrives as a piece of another application. It also
 * takes two gestures to answer: spin, then confirm.
 *
 * This is one tap on the thing you want, in rows the size of the rows everywhere
 * else, and the current choice is visible without opening anything because the
 * row that opens it shows the answer.
 *
 * Laid out like the list these things are managed in — one card, hairlines
 * between the rows, the name above what it is. Choosing an account and editing
 * one are the same rows in two places, and a picker that invented its own shape
 * would make the person match them up by reading.
 */
export function OptionSheet({
  title,
  options,
  value,
  onSelect,
  onClose,
}: OptionSheetProps) {
  return (
    <BottomSheet title={title} onClose={onClose} expandable>
      <ul className="mx-1 divide-y divide-line rounded-card bg-surface px-4">
        {options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => {
                onSelect(option.value)
                onClose()
              }}
              className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium text-ink">
                  {option.label}
                </span>

                {option.caption && (
                  <span className="block truncate text-xs text-muted">{option.caption}</span>
                )}
              </span>

              {option.value === value && <CheckIcon className="size-4 shrink-0 text-accent" />}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}
