import { useEffect, useRef, useState } from 'react'
import { monthLabel, monthShortLabel, monthKey, todayIso } from '../../../lib/dates'
import { compactBRL, formatBRL } from '../../../lib/money'
import { tick } from '../../../lib/haptics'
import { ceiling, read, type Reading, type Trend } from '../trend'
import type { MonthTotal } from '../../../services/types'

interface MonthBarsProps {
  totals: MonthTotal[]
  selected: string
  onSelect: (month: string) => void
}

/**
 * Five months at a time, and the middle one is the month.
 *
 * The chart is a window that slides over a history, not a list you happen to
 * scroll. Whatever comes to rest in the centre is what the screen below is
 * about, so choosing a month and looking at a month are the same act — there is
 * no state where the list is showing March while the eye is parked on August.
 *
 * Five because it is the smallest odd number with a shoulder on each side: a
 * centre, a neighbour either way, and one more beyond that for the direction to
 * be visible. Three would centre a month with nothing but its immediate
 * neighbours, which is a comparison so short it is nearly the sentence under the
 * chart. Seven starts to be a chart you read rather than a month you are on.
 *
 * Columns are a fifth of the frame, whatever the frame is. A fixed width in
 * pixels shows four and a half months on one phone and six on another, and the
 * half is the tell — the eye reads a cut-off column as "there is more" and stops
 * treating the middle as special. Proportional widths make the layout the same
 * shape on every device, which is what makes "the one in the middle" a rule
 * someone can rely on rather than an accident of screen size.
 *
 * Two columns of empty space at each end, so the first and last month can reach
 * the centre. Without them the history has months that can be seen and never
 * chosen, which is the sort of thing that reads as the app losing data.
 *
 * Snapping is mandatory, and it stops at every month. Without `snap-always` a
 * flick crosses however many months its momentum carries, and since landing
 * somewhere is now choosing something, that turns one gesture into a decision
 * nobody made — the list, the total and the whole screen below arrive at a month
 * picked by friction. One flick, one month; the arrows and the target above the
 * chart are there for the long trips.
 *
 * A month that settles in the centre is confirmed by feel as well as by sight.
 * `tick` is a request rather than a call — see `lib/haptics` for what the web
 * can and cannot promise here.
 *
 * Heights are relative to the tallest of the five, not to the tallest on record.
 * See `ceiling` for why: one month with a car deposit in it would otherwise be
 * the yardstick for every month that ever follows. The window and what is on
 * screen are now the same five months, so the scale is always about what is
 * being looked at.
 *
 * Every column carries its figure. Bars answer "which months were heavy" at a
 * glance and "how heavy" not at all — the height is a ratio to a peak that is
 * itself off screen half the time. With the number above each one the chart
 * answers both, and a month worth returning to can be picked out before it is
 * reached rather than after.
 *
 * The cents are dropped from those labels, and six figures become "R$ 123,5
 * mil". The label has a column and not a line: an amount that wraps drags the
 * chart's baseline with it, and one clipped with an ellipsis is a wrong amount
 * that looks deliberate. Anyone reading a bar wants its order of magnitude, and
 * the exact total is set in full above the chart for the month in the middle —
 * so the notation gives way before the layout does. The width is asserted in
 * `money.test.ts` rather than eyeballed, because the amount that breaks it is
 * one nobody has entered yet.
 *
 * Colour on a bar says which way the month went, never which month is chosen.
 * That separation is what lets both be true at once: the centre says what the
 * list below is showing, and the fill says whether a month cost more than the
 * one before it. Had selection stayed on the fill, moving through the months
 * would have overwritten the one thing the chart is here to say.
 *
 * A wall of red is the message. Any single red bar is a shrug — every household
 * has a month that cost more than the last — but four in a row is a direction,
 * and a direction is something to act on.
 *
 * The bars stand on an axis rather than floating over the page. Without a line
 * the eye has to infer the baseline from the bars themselves, which works while
 * they are tall and fails exactly where it matters — a run of small months reads
 * as noise at the bottom of the screen instead of as low months on a scale.
 *
 * The line is drawn by the columns, not over them: each column carries the same
 * bottom border and they sit flush, so the axis is continuous by construction
 * and cannot drift out of step with the bars it belongs to. Which is why the
 * spacing between bars lives inside the column as padding — a flex gap would cut
 * the axis into dashes.
 *
 * Bars move to a new height rather than appearing at one. The scale changes as
 * a consequence of a gesture aimed at something else, so a bar that jumps reads
 * as a glitch; growing says the height is a measurement being retaken. Each runs
 * its own transition, which is what makes the ones that barely moved legible as
 * barely having moved.
 *
 * A month with nothing spent draws no bar at all. It used to draw a sliver, so
 * that something was there; with an axis under it, that sliver claims a small
 * amount was spent, and the line already says the month exists.
 *
 * A tap moves that month to the centre rather than selecting it where it stands.
 * The centre is the rule, and a selected month sitting off to one side would be
 * the exception that stops anyone believing the rule.
 */

/**
 * Written out rather than built from the trend, because a class assembled at
 * runtime is a class Tailwind never sees and never emits.
 */
const FILL: Record<Trend, string> = {
  now: 'bg-now',
  rise: 'bg-rise',
  steady: 'bg-steady',
}

/**
 * Colour is not available to everyone, and it is the only thing carrying the
 * warning. Whatever the fill says, the label says too.
 */
function label(reading: Reading): string {
  const parts = [monthLabel(reading.month), formatBRL(reading.cents)]

  if (reading.trend === 'now') parts.push('mês atual')

  if (reading.trend === 'rise') parts.push('aumento em relação ao mês anterior')

  if (reading.peak) parts.push('maior gasto do período')

  if (reading.floor) parts.push('menor gasto do período')

  return parts.join(', ')
}

/**
 * How long a scroller has to be still before it counts as stopped.
 *
 * Long, and deliberately so. Landing on a month now reloads the list, the total
 * and the sentence under the chart, so the cost of answering early is a screen
 * that rebuilds itself two or three times while somebody is still moving through
 * the months. Waiting is cheap here because nothing is hidden in the meantime —
 * the chart has already moved, the centre column is already lit, and the only
 * thing still catching up is what is below it.
 */
const SETTLE = 800

export function MonthBars({ totals, selected, onSelect }: MonthBarsProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const current = useRef<HTMLButtonElement>(null)

  const painted = useRef(false)

  /** The last month to pass under the centre, so each one is felt exactly once. */
  const crossed = useRef(selected)

  /**
   * Two speeds, because the two jobs have different costs.
   *
   * `live` is which column is lit, and it follows the finger frame by frame. It
   * costs a class name, and a highlight that lags behind the gesture is the
   * clearest way to make a chart feel like it is being remote-controlled.
   *
   * `landed` is what the scale is drawn against and what the screen below is
   * showing, and it waits for the scroll to stop. That one costs a reload of the
   * list, the total and the sentence under the chart, and paying it for every
   * month a flick passes over rebuilds the screen several times on the way to a
   * month nobody asked for.
   *
   * Nothing is hidden by the wait: the column is already lit, so the chart has
   * already answered. What is below it is catching up, and it is allowed to.
   */
  const [live, setLive] = useState(selected)
  const [landed, setLanded] = useState(selected)
  const [chosenMonth, setChosenMonth] = useState(selected)

  if (selected !== chosenMonth) {
    setChosenMonth(selected)
    setLive(selected)
    setLanded(selected)
  }

  /**
   * The selection is brought to the centre whenever it changes, and instantly on
   * the first paint — a month chosen from anywhere, including the arrows and the
   * target above the chart, has to end up where the rule says the chosen month
   * lives.
   *
   * The first one cannot animate: sliding in from wherever the browser happened
   * to start reads as a loading state that never resolves.
   *
   * Already centred is left alone. Selection can arrive *from* the scroll, and
   * scrolling a scroller back to where it already is restarts its momentum on
   * iOS — the finger lifts, the chart stops dead, and it reads as the app
   * fighting the gesture.
   */
  useEffect(() => {
    const element = scroller.current
    const column = current.current

    if (!element || !column) return

    const off = Math.abs(centreOf(column) - element.scrollLeft - element.clientWidth / 2)


    if (off > 2) {
      column.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: painted.current ? 'smooth' : 'instant',
      })
    }

    painted.current = true
  }, [selected])

  /**
   * Whatever the scroll lands on becomes the month, once it has stopped.
   *
   * On settle rather than live: reporting mid-flick would run the list, the
   * total and the whole screen below through every month the finger passed
   * over. `SETTLE` is the pause that means stopped — long enough not to fire
   * between flicks of one gesture, short enough that nobody is waiting for it.
   */
  useEffect(() => {
    const element = scroller.current

    if (!element) return

    let timer: ReturnType<typeof setTimeout>
    let frame = 0

    function settled() {
      const middle = centred(element, track.current)

      if (middle) {
        setLanded(middle)

        if (middle !== chosenMonth) {
          setChosenMonth(middle)
          onSelect(middle)
        }
      }
    }

    /**
     * Once per frame at most. Scroll fires far more often than the screen is
     * drawn, and measuring the columns on every one of those is work thrown away
     * before anybody could see it.
     */
    function measure() {
      frame = 0

      const middle = centred(element, track.current)

      if (!middle) return

      if (crossed.current !== middle) {
        // Each month crossing the centre gets its own tick, the way a picker
        // wheel does — the feel belongs to the gesture, not to where it stops.
        crossed.current = middle
        tick()
      }

      setLive(middle)
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(measure)

      clearTimeout(timer)
      timer = setTimeout(settled, SETTLE)
    }

    element.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', onScroll)
    }
  }, [chosenMonth, onSelect])

  const readings = read(totals, monthKey(todayIso()))
  const tallest = ceiling(readings, landed)

  return (
    <div
      ref={scroller}
      className="touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    >
      <div ref={track} className="flex w-max items-end" role="group" aria-label="Despesas por mês">
        <Edge />

        {readings.map((reading) => {
          const chosen = reading.month === live
          const share = tallest === 0 ? 0 : Math.min(reading.cents / tallest, 1)

          return (
            <button
              key={reading.month}
              ref={reading.month === selected ? current : null}
              data-month={reading.month}
              type="button"
              onClick={() => onSelect(reading.month)}
              aria-pressed={reading.month === selected}
              aria-label={label(reading)}
              className={`flex w-[20vw] max-w-24 shrink-0 snap-center snap-always flex-col items-center gap-1.5 rounded-2xl px-1 pt-2 ${
                chosen ? 'bg-white/6' : ''
              }`}
            >
              <span
                className={`tnum text-[0.625rem] font-semibold whitespace-nowrap ${
                  chosen ? 'text-ink' : 'text-faint'
                }`}
              >
                {compactBRL(reading.cents)}
              </span>

              <span className="flex h-28 w-full items-end justify-center border-b border-line">
                {reading.cents > 0 && (
                  <span
                    style={{ height: `${Math.max(share * 100, 4)}%` }}
                    className={`bar-grow w-3 rounded-t-full ${FILL[reading.trend]}`}
                  />
                )}
              </span>

              <span
                className={`pb-2 text-[0.625rem] font-medium tracking-wide uppercase ${
                  chosen ? 'text-accent' : 'text-faint'
                }`}
              >
                {monthShortLabel(reading.month)}
              </span>
            </button>
          )
        })}

        <Edge />
      </div>
    </div>
  )
}

/** Two columns of nothing, so the first and last month can reach the middle. */
function Edge() {
  return <span aria-hidden="true" className="w-[40vw] max-w-48 shrink-0" />
}

function centreOf(column: HTMLElement): number {
  return column.offsetLeft + column.offsetWidth / 2
}

/**
 * The month nearest the middle of the frame.
 *
 * Measured rather than calculated from a column width and a scroll offset. The
 * arithmetic version has to know about the spacers at both ends and agree with
 * the CSS about how wide a column is, and it goes quietly wrong the day either
 * changes. Asking the elements where they are cannot disagree with where they
 * are.
 */
function centred(element: HTMLElement | null, track: HTMLElement | null): string | null {
  if (!element || !track) return null

  const middle = element.scrollLeft + element.clientWidth / 2
  const columns = [...track.querySelectorAll<HTMLElement>('[data-month]')]

  const nearest = columns.reduce<HTMLElement | null>((closest, column) => {
    if (!closest) return column

    return Math.abs(centreOf(column) - middle) < Math.abs(centreOf(closest) - middle)
      ? column
      : closest
  }, null)

  return nearest?.getAttribute('data-month') ?? null
}

