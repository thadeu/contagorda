import type { Transaction } from '../../services/types'
import type { IsoDate } from '../../lib/dates'

export interface DayGroup {
  date: IsoDate
  transactions: Transaction[]
  netCents: number
}

/**
 * Groups a month into days, newest first.
 *
 * Newest first because the question people open the app with is "what happened
 * recently", not "how did the month begin". Within a day the original order is
 * kept, so a list does not reshuffle when something is edited.
 */
export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const byDate = new Map<IsoDate, Transaction[]>()

  for (const transaction of transactions) {
    const bucket = byDate.get(transaction.date)

    if (bucket) {
      bucket.push(transaction)
    } else {
      byDate.set(transaction.date, [transaction])
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => ({
      date,
      transactions: rows,
      netCents: rows.reduce(
        (total, t) => total + (t.kind === 'income' ? t.amount_cents : -t.amount_cents),
        0,
      ),
    }))
}

export function peakNet(groups: DayGroup[]): number {
  return groups.reduce((peak, group) => Math.max(peak, Math.abs(group.netCents)), 0)
}
