import { useLayoutEffect, useRef, useState } from 'react'
import { monthKey, monthLabel, todayIso } from '@/lib/dates'
import { useMonthsWithData } from '@/features/transactions/hooks'
import { buildMonthOptions } from '@/features/dashboard/monthOptions'
import { useMonthCloner } from '@/features/monthClone/monthCloneContext'
import { BottomSheet } from '@/ui/BottomSheet'
import { ChevronDownIcon, CopyIcon } from '@/ui/icons'

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
  const cloner = useMonthCloner()
  const current = monthKey(todayIso())

  const groups = buildMonthOptions(withData.data ?? [], current)
  const filled = new Set(withData.data ?? [])
  const optionCount = groups.reduce((total, group) => total + group.months.length, 0)

  const currentRow = useRef<HTMLLIElement>(null)

  // The list is oldest first and the current month is somewhere in the middle,
  // so opening it means putting that month at the top: the past is a scroll up,
  // the future a scroll down. Again when the range grows, because months arriving
  // above it would otherwise push it out of view.
  useLayoutEffect(() => {
    if (open && currentRow.current) scrollToTop(currentRow.current)
  }, [open, optionCount])

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
                    <li
                      key={option}
                      ref={option === current ? currentRow : undefined}
                      className="flex gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(option)
                          setOpen(false)
                        }}
                        aria-current={option === month}
                        className={`flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-control px-4 text-left text-[0.9375rem] first-letter:uppercase ${
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

                      {filled.has(option) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false)
                            cloner.openFrom(option)
                          }}
                          aria-label={`Copiar lançamentos de ${monthLabel(option)}`}
                          className="grid size-12 shrink-0 place-items-center rounded-control bg-sunken text-muted"
                        >
                          <CopyIcon className="size-4" strokeWidth={2} />
                        </button>
                      )}
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

/**
 * Scrolls the nearest scrolling ancestor so the row sits at its top edge.
 *
 * By hand and not with `scrollIntoView`, which also scrolls every ancestor up to
 * the page — and on iOS a sheet that nudges the document behind it is the bug
 * ADR 0003 is about.
 */
function scrollToTop(row: HTMLElement) {
  let scroller = row.parentElement

  while (scroller && !scrolls(scroller)) {
    scroller = scroller.parentElement
  }

  if (!scroller) return

  scroller.scrollTop += row.getBoundingClientRect().top - scroller.getBoundingClientRect().top
}

function scrolls(element: HTMLElement): boolean {
  return (
    element.scrollHeight > element.clientHeight &&
    /(auto|scroll)/.test(getComputedStyle(element).overflowY)
  )
}
