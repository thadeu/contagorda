import { useEffect, useRef } from 'react'
import { monthShortLabel } from '../../../lib/dates'
import { roundBRL } from '../../../lib/money'
import type { MonthTotal } from '../../../services/types'

interface MonthBarsProps {
  totals: MonthTotal[]
  selected: string
  onSelect: (month: string) => void
}

/**
 * Every month there has ever been, one column each.
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
 * Every column carries its figure. Bars answer "which months were heavy" at a
 * glance and "how heavy" not at all — the height is a ratio to a peak that is
 * itself off screen half the time. With the number above each one the chart
 * answers both, and a month worth returning to can be picked out before it is
 * tapped rather than after.
 *
 * The cents are dropped from those labels. On a month's total they are two
 * digits that never change the answer, and they double the width of something
 * that has to sit above a bar.
 *
 * The chosen month is a lit column, not a coloured bar. Colour alone puts the
 * mark on the one part of the column that is also carrying data, so a tall
 * selected month and a tall expensive month make the same shape; the band covers
 * figure, bar and name together, which is what "this whole column is what the
 * screen below is about" actually looks like.
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
    <div ref={scroller} className="touch-pan-x overflow-x-auto overscroll-x-contain px-4">
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
              className={`flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-1.5 rounded-2xl px-2 pt-2 ${
                chosen ? 'bg-white/6' : ''
              }`}
            >
              <span
                className={`tnum text-[0.625rem] font-semibold ${chosen ? 'text-ink' : 'text-faint'}`}
              >
                {roundBRL(total.expense_cents)}
              </span>

              <span className="flex h-28 w-full items-end justify-center border-b border-line">
                {total.expense_cents > 0 && (
                  <span
                    style={{ height: `${Math.max(share * 100, 4)}%` }}
                    className={`w-2.5 rounded-t-full ${chosen ? 'bg-accent' : 'bg-sunken'}`}
                  />
                )}
              </span>

              <span
                className={`pb-2 text-[0.625rem] font-medium tracking-wide uppercase ${
                  chosen ? 'text-accent' : 'text-faint'
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
