import { useSearchParams } from 'react-router'
import { isSort, type Sort } from './sorting'
import type { Transaction } from '@/services/types'

export type Status = 'pending' | 'paid'
export type Kind = 'expense' | 'income'

const PARAM = 'status'
const SORT_PARAM = 'sort'
const KIND_PARAM = 'kind'

/**
 * Pending is the default because it is the question the app exists to answer:
 * what still has to be paid. The paid list is a record; the pending list is a
 * task list, and that is the one someone opens the app to look at.
 *
 * Expense is the default kind for the same reason: the list is the bills. Income
 * is a few lines a month and shows on its own only while the income card is
 * pressed, so the two never mix into a list where a salary sits between two
 * bills and the count of "paid" means two things at once.
 *
 * Like the month, this lives in the URL so the view survives the reload an
 * installed PWA does constantly.
 */
export function useStatusFilter() {
  const [params, setParams] = useSearchParams()

  const status: Status = params.get(PARAM) === 'paid' ? 'paid' : 'pending'
  const kind: Kind = params.get(KIND_PARAM) === 'income' ? 'income' : 'expense'
  const sortParam = params.get(SORT_PARAM)
  const sort: Sort = isSort(sortParam) ? sortParam : 'date'

  function write(key: string, value: string | null) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)

        if (value === null) {
          updated.delete(key)
        } else {
          updated.set(key, value)
        }

        return updated
      },
      { replace: true },
    )
  }

  return {
    status,
    sort,
    kind,
    setStatus: (next: Status) => write(PARAM, next),
    setSort: (next: Sort) => write(SORT_PARAM, next),
    // The default is absent rather than written, so the URL stays short in the
    // state it is in nearly all the time.
    toggleKind: () => write(KIND_PARAM, kind === 'income' ? null : 'income'),
  }
}

export function matchesStatus(transaction: Transaction, status: Status): boolean {
  return status === 'paid' ? transaction.paid_at !== null : transaction.paid_at === null
}

export function matchesKind(transaction: Transaction, kind: Kind): boolean {
  return transaction.kind === kind
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
