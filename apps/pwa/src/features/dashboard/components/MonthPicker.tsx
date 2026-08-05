import { useState } from 'react'
import { monthKey, monthLabel, shiftMonth, todayIso } from '../../../lib/dates'
import { BottomSheet } from '../../../ui/BottomSheet'
import { ChevronDownIcon } from '../../../ui/icons'

interface MonthPickerProps {
  month: string
  onChange: (month: string) => void
}

/** A year back, three months forward — enough to plan without becoming a list. */
const BACK = 12
const FORWARD = 3

/**
 * A pill that opens a list, rather than two arrows.
 *
 * Arrows only answer "next" and "previous"; picking a month five back means
 * five taps and no way to see where you are going. The pill states the month it
 * is on and opens the range at once.
 */
export function MonthPicker({ month, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const current = monthKey(todayIso())

  const options = Array.from({ length: BACK + FORWARD + 1 }, (_, index) =>
    shiftMonth(current, FORWARD - index),
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 pr-2.5 pl-3.5 text-sm font-medium text-white capitalize"
      >
        {monthLabel(month)}
        <ChevronDownIcon className="size-4 opacity-70" />
      </button>

      {open && (
        <BottomSheet title="Mês" onClose={() => setOpen(false)}>
          <ul className="grid gap-1">
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  aria-current={option === month}
                  className={`min-h-12 w-full rounded-control px-4 text-left text-[0.9375rem] capitalize ${
                    option === month ? 'bg-brand font-semibold text-white' : 'bg-sunken text-ink'
                  }`}
                >
                  {monthLabel(option)}
                  {option === current && (
                    <span
                      className={`pl-2 text-xs ${option === month ? 'text-white/60' : 'text-muted'}`}
                    >
                      atual
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </>
  )
}
