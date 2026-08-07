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
 * The bars stand on an axis rather than floating over the page. Without a line
 * the eye has to infer the baseline from the bars themselves, which works while
 * they are tall and fails exactly where it matters — a run of small months reads
 * as noise at the bottom of the screen instead of as low months on a scale.
 *
 * The line is drawn by the columns, not over them: each column carries the same
 * bottom border and they sit flush, so the axis is continuous by construction and
 * cannot drift out of step with the bars it belongs to. Which is why the gap
 * moved inside the column as padding — a flex gap would cut the axis into
 * dashes, and the spacing between bars is identical either way.
 *
 * A month with nothing spent draws no bar at all. It used to draw a sliver, so
 * that something was there; with an axis under it, that sliver claims a small
 * amount was spent, and the line already says the month exists.
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
    <div ref={scroller} className="touch-pan-x overflow-x-auto overscroll-x-contain px-4 pb-1">
      <div
        className="ms-auto flex w-max snap-x items-end"
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
              className="flex w-11 shrink-0 snap-center flex-col items-center gap-2 px-1.5"
            >
              <span className="flex h-32 w-full items-end justify-center border-b border-line">
                {total.expense_cents > 0 && (
                  <span
                    style={{ height: `${Math.max(share * 100, 4)}%` }}
                    className={`w-2.5 rounded-t-full ${chosen ? 'bg-accent' : 'bg-sunken'}`}
                  />
                )}
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
