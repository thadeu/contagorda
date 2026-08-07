import type { MonthTotal } from '@/services/types'

/**
 * What a bar is saying, beyond how tall it is.
 *
 * `rise` is the only one that carries a warning, and it is deliberately the
 * cheapest possible test: this month cost more than the one before it. Not more
 * than an average, not more than a forecast — a comparison anyone can check by
 * looking one column to the left, which is what makes the colour trustworthy.
 * A cleverer rule would be right more often and believed less.
 */
export type Trend = 'now' | 'rise' | 'steady'

export interface Reading {
  month: string
  cents: number
  trend: Trend
  /** The most and the least spent across everything on record. */
  peak: boolean
  floor: boolean
}

/**
 * Reads the run of months once and says what each bar means.
 *
 * The current month is always `now`, whichever way it went. It is the only month
 * still being written, so calling it a rise is a verdict on a week and a half of
 * data — and the one thing someone needs to find instantly in a decade of
 * columns is where they are standing.
 *
 * Everything else is compared with the month immediately before it, so a stretch
 * of red is a stretch of months that each cost more than the last. That is the
 * whole point of the colouring: an app that says "you spent 4.037 in August"
 * says nothing a bank statement doesn't, and one that says "and that is the
 * third month in a row that went up" is the reason to look.
 *
 * The first month on record has nothing to its left and is never a rise. A chart
 * that opens with a red column because there is no earlier month to compare
 * would be accusing someone of the day they started using the app.
 *
 * The floor ignores months with nothing in them. A month with no entries is
 * missing data, not a cheap month, and letting it take the title makes the label
 * a lie in exactly the case where someone forgot to enter anything.
 */
export function read(totals: MonthTotal[], current: string): Reading[] {
  const spent = totals.filter((total) => total.expense_cents > 0)
  const peak = spent.reduce((most, total) => Math.max(most, total.expense_cents), 0)
  const floor = spent.reduce(
    (least, total) => Math.min(least, total.expense_cents),
    spent[0]?.expense_cents ?? 0,
  )

  return totals.map((total, index) => {
    const previous = totals[index - 1]

    return {
      month: total.month,
      cents: total.expense_cents,
      trend:
        total.month === current
          ? 'now'
          : previous && total.expense_cents > previous.expense_cents
            ? 'rise'
            : 'steady',
      peak: peak > 0 && total.expense_cents === peak,
      floor: floor > 0 && total.expense_cents === floor,
    }
  })
}

/** Two months either side, so the window is the five the chart shows at once. */
const SPAN = 2

/**
 * The tallest month near the one being read, which is what the bars are drawn
 * against.
 *
 * Scaling to the whole history sounds fairer and is unusable. One month with a
 * car deposit in it becomes the yardstick for every month that ever follows, so
 * two years later a household is still reading its groceries as a sliver — the
 * chart has a permanent memory of a single Tuesday and nothing else can be
 * compared. Against its neighbours, a month is read against the months anyone
 * would actually compare it with, and the shape returns as the outlier scrolls
 * out of range.
 *
 * Five, because five is what the chart shows. The scale and the frame have to be
 * the same set of months, or the tallest bar on screen is not full and nothing
 * says why. A wider window is steadier and says less: stretch it far enough and
 * it is the whole history again, with the outlier back to flattening months that
 * have nothing to do with it.
 *
 * The cost, stated plainly: the same month is not always the same height. That
 * is the trade — a chart that is legible about the recent past against one that
 * is stable and flat. It stays legible because the window follows the selection,
 * which is deliberate and infrequent, and never the scroll position, which is
 * neither. A bar that changed height under a moving finger would be the version
 * of this that is actually broken.
 *
 * Bars outside the window can be taller than the window's tallest, and they are
 * simply full. Beyond the neighbourhood the exact ratio is not a claim the chart
 * is making, and the figure above the bar is right whatever the height does.
 */
export function ceiling(readings: Reading[], selected: string): number {
  const at = readings.findIndex((reading) => reading.month === selected)
  const from = at < 0 ? 0 : Math.max(at - SPAN, 0)
  const window = at < 0 ? readings : readings.slice(from, at + SPAN + 1)

  return window.reduce((most, reading) => Math.max(most, reading.cents), 0)
}

export interface Difference {
  /** Always positive. The direction is the direction, not the sign. */
  cents: number
  direction: 'more' | 'less'
  /** The month it is being compared with, for naming it rather than pointing. */
  previous: string
}

/**
 * How this month compares with the one before it, in money.
 *
 * The colour already says which way it went; this says by how much, which is the
 * difference between a warning and something to act on. Two hundred reais over
 * last month is a heavier week, and two thousand is a decision someone made and
 * may not remember making.
 *
 * Nothing is returned when the months are level or when there is no month before
 * — a sentence saying "the same" is a line of text charging rent to say nothing,
 * and the first month of a history has nothing to compare against.
 */
export function difference(readings: Reading[], selected: string): Difference | null {
  const at = readings.findIndex((reading) => reading.month === selected)

  if (at < 1) return null

  const gap = readings[at].cents - readings[at - 1].cents

  if (gap === 0) return null

  return {
    cents: Math.abs(gap),
    direction: gap > 0 ? 'more' : 'less',
    previous: readings[at - 1].month,
  }
}
