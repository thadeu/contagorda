import { useSearchParams } from 'react-router'
import { isSort, type Sort } from './sorting'
import type { Transaction } from '@/services/types'

export type Status = 'pending' | 'paid'

const PARAM = 'status'
const SORT_PARAM = 'sort'

/**
 * Pending is the default because it is the question the app exists to answer:
 * what still has to be paid. The paid list is a record; the pending list is a
 * task list, and that is the one someone opens the app to look at.
 *
 * Like the month, this lives in the URL so the view survives the reload an
 * installed PWA does constantly.
 */
export function useStatusFilter() {
  const [params, setParams] = useSearchParams()

  const status: Status = params.get(PARAM) === 'paid' ? 'paid' : 'pending'
  const sortParam = params.get(SORT_PARAM)
  const sort: Sort = isSort(sortParam) ? sortParam : 'date'

  function write(key: string, value: string) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)

        updated.set(key, value)

        return updated
      },
      { replace: true },
    )
  }

  return {
    status,
    sort,
    setStatus: (next: Status) => write(PARAM, next),
    setSort: (next: Sort) => write(SORT_PARAM, next),
  }
}

export function matchesStatus(transaction: Transaction, status: Status): boolean {
  return status === 'paid' ? transaction.paid_at !== null : transaction.paid_at === null
}

/**
 * Both lists run newest first, so a month opens at its end.
 *
 * Pending used to run the other way, on the argument that anything overdue
 * should lead. That is the right instinct on the day a bill goes late and the
 * wrong one every other day: what is being checked is usually what just
 * happened, and starting at the first of the month means scrolling past
 * everything already dealt with to reach it.
 *
 * Overdue rows are not lost by this — they carry their own colour and the tab
 * carries the count. Sorting was never what made them visible.
 */
export const LIST_ORDER = 'desc' as const
