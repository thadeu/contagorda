import type { Transaction } from '@/services/types'
import type { IsoDate } from '@/lib/dates'

export interface DayGroup {
  date: IsoDate
  transactions: Transaction[]
  netCents: number
}

/**
 * Groups a month into days.
 *
 * The order is a parameter rather than a constant because the two lists answer
 * different questions: a pending list is read soonest-first, so anything overdue
 * leads; a paid list is read newest-first, because it is a record of what just
 * happened. Within a day the original order is kept, so nothing reshuffles when
 * a row is edited.
 */
export function groupByDay(transactions: Transaction[], order: 'asc' | 'desc' = 'desc'): DayGroup[] {
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
    .sort(([a], [b]) => (order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)))
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
