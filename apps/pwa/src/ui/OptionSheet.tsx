import type { ReactNode } from 'react'
import { BottomSheet } from './BottomSheet'
import { CheckIcon } from './icons'

export interface Option {
  value: string
  label: string
}

interface OptionSheetProps {
  title: string
  options: Option[]
  value: string
  onSelect: (value: string) => void
  onClose: () => void
  /** Rendered under the list. For the case the list cannot cover. */
  footer?: ReactNode
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
 */
export function OptionSheet({
  title,
  options,
  value,
  onSelect,
  onClose,
  footer,
}: OptionSheetProps) {
  return (
    <BottomSheet title={title} onClose={onClose} expandable>
      <ul className="px-2">
        {options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => {
                onSelect(option.value)
                onClose()
              }}
              className="flex min-h-13 w-full items-center justify-between gap-3 rounded-control px-3 text-left"
            >
              <span className="min-w-0 truncate text-[0.9375rem] text-ink">{option.label}</span>

              {option.value === value && <CheckIcon className="size-4 shrink-0 text-accent" />}
            </button>
          </li>
        ))}
      </ul>

      {footer}
    </BottomSheet>
  )
}
