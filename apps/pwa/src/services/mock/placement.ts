import type { Transaction } from '@/services/types'

/**
 * Where each row stands in its series, counted the way the server counts it:
 * from the rows the series has now, in date order. The fourth of eighteen.
 *
 * Derived on every read rather than stored, because it changes whenever any
 * other row of the series is added or removed — a stored number would be right
 * until the first delete.
 *
 * `subset` is what is being answered, `all` is what the series is counted from.
 */
export function withPlacement(all: Transaction[], subset: Transaction[] = all): Transaction[] {
  const bySeries = new Map<string, Transaction[]>()

  for (const row of all) {
    if (!row.recurring_series_id) continue

    const rows = bySeries.get(row.recurring_series_id) ?? []

    rows.push(row)
    bySeries.set(row.recurring_series_id, rows)
  }

  for (const rows of bySeries.values()) {
    rows.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))
  }

  return subset.map((row) => {
    const rows = row.recurring_series_id ? bySeries.get(row.recurring_series_id) : undefined

    if (!rows || !row.recurrence) return row

    return {
      ...row,
      recurrence: {
        ...row.recurrence,
        position: rows.findIndex((candidate) => candidate.id === row.id) + 1,
        total: rows.length,
      },
    }
  })
}
