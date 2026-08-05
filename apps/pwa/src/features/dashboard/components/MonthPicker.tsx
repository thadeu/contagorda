import { useState } from 'react'
import { monthKey, monthLabel, todayIso } from '../../../lib/dates'
import { useMonthsWithData } from '../../transactions/hooks'
import { buildMonthOptions } from '../monthOptions'
import { BottomSheet } from '../../../ui/BottomSheet'
import { ChevronDownIcon } from '../../../ui/icons'

interface MonthPickerProps {
  month: string
  onChange: (month: string) => void
}

/**
 * A pill that opens a list, rather than two arrows.
 *
 * Arrows only answer "next" and "previous", so reaching a month five back costs
 * five taps with no view of where you are going. The pill states the month it is
 * on and opens the whole range at once, grouped by year — which is how someone
 * looking for "March last year" actually navigates.
 */
export function MonthPicker({ month, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const withData = useMonthsWithData()
  const current = monthKey(todayIso())

  const groups = buildMonthOptions(withData.data ?? [], current)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/12 pr-2.5 pl-3.5 text-sm font-medium text-white first-letter:uppercase"
      >
        {monthLabel(month)}
        <ChevronDownIcon className="size-4 opacity-70" />
      </button>

      {open && (
        <BottomSheet title="Mês" expandable onClose={() => setOpen(false)}>
          <div className="grid gap-4 px-1 pb-2">
            {groups.map((group) => (
              <section key={group.year}>
                <h3 className="tnum px-3 pb-1.5 text-xs font-semibold tracking-wide text-faint">
                  {group.year}
                </h3>

                <ul className="grid gap-1">
                  {group.months.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(option)
                          setOpen(false)
                        }}
                        aria-current={option === month}
                        className={`flex min-h-12 w-full items-center justify-between rounded-control px-4 text-left text-[0.9375rem] first-letter:uppercase ${
                          option === month
                            ? 'bg-brand font-semibold text-white'
                            : 'bg-sunken text-ink'
                        }`}
                      >
                        {monthLabel(option).replace(/ de \d+$/, '')}

                        {option === current && (
                          <span
                            className={`text-xs ${option === month ? 'text-white/60' : 'text-muted'}`}
                          >
                            atual
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </BottomSheet>
      )}
    </>
  )
}
