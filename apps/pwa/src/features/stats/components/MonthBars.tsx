import { useEffect, useRef } from 'react'
import { monthShortLabel } from '../../../lib/dates'
import type { MonthTotal } from '../../../services/types'

interface MonthBarsProps {
  totals: MonthTotal[]
  selected: string
  onSelect: (month: string) => void
}

/**
 * Every month there has ever been, one bar each.
 *
 * It scrolls sideways rather than fitting a window into the screen. Ten years of
 * imported statements is a hundred and twenty bars, and any fixed window would
 * have to invent a rule for which ones — while a scroller lets the finger decide
 * and needs no control to say so.
 *
 * Heights are relative to the biggest month on record, so the tallest bar is
 * always full and the rest are read against it. Scaling to whatever is on screen
 * would make the same month change height as you scroll, which is the one thing
 * a chart must not do.
 *
 * The newest month sits at the right edge whether there are six months or six
 * hundred. Time runs left to right, so the present belongs at the end of it —
 * and a short history hugging the left with empty space after it reads as a
 * chart that failed to load rather than one with little to say. `ms-auto` on the
 * track does it without reversing anything: it pushes right while the bars fit
 * and does nothing once they overflow, when scrolling takes over.
 *
 * The selected month is brought into view when the screen opens. Landing at the
 * far end of a decade of history and having to scroll to find the month you came
 * from is the sort of thing that gets called broken.
 */

export function MonthBars({ totals, selected, onSelect }: MonthBarsProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const current = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    current.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  const peak = totals.reduce((most, total) => Math.max(most, total.expense_cents), 0)

  return (
    <div ref={scroller} className="overflow-x-auto px-4 pb-1">
      <div
        className="ms-auto flex w-max snap-x items-end gap-3"
        role="group"
        aria-label="Despesas por mês"
      >
        {totals.map((total) => {
          const chosen = total.month === selected
          const share = peak === 0 ? 0 : total.expense_cents / peak

          return (
            <button
              key={total.month}
              ref={chosen ? current : null}
              type="button"
              onClick={() => onSelect(total.month)}
              aria-pressed={chosen}
              className="flex w-8 shrink-0 snap-center flex-col items-center gap-2"
            >
              <span className="flex h-32 w-full items-end justify-center">
                <span
                  style={{ height: `${Math.max(share * 100, 3)}%` }}
                  className={`w-2.5 rounded-full ${chosen ? 'bg-accent' : 'bg-sunken'}`}
                />
              </span>

              <span
                className={`text-[0.625rem] font-medium tracking-wide uppercase ${
                  chosen ? 'text-ink' : 'text-faint'
                }`}
              >
                {monthShortLabel(total.month)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
