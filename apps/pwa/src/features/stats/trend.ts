import type { MonthTotal } from '../../services/types'

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
