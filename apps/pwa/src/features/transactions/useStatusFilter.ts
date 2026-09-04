import { useSearchParams } from 'react-router'
import { isSort, type Sort } from './sorting'
import type { Transaction } from '@/services/types'

export type Status = 'pending' | 'paid'

/**
 * What the list is about, before it is about a status.
 *
 * `all` is the month. `income` is only what came in, paid or not — a scope,
 * not a status: the question it answers is "what were my receipts", and a
 * receipt that has not landed yet is still one of them. While a scope is on
 * the status filter is set aside rather than combined with it, because "unpaid
 * income" is not a list anybody opens the app to see.
 */
export type Scope = 'all' | 'income'

const PARAM = 'status'
const SORT_PARAM = 'sort'
const SCOPE_PARAM = 'scope'

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
  const scope: Scope = params.get(SCOPE_PARAM) === 'income' ? 'income' : 'all'
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
    scope,
    sort,
    setStatus: (next: Status) => write(PARAM, next),
    // The default is absent rather than written, so a URL with no scope stays
    // the URL it was before scopes existed.
    setScope: (next: Scope) => write(SCOPE_PARAM, next === 'all' ? null : next),
    setSort: (next: Sort) => write(SORT_PARAM, next),
  }
}

/**
 * Which rows the list shows. A scope replaces the status rather than adding to
 * it — see `Scope`.
 */
export function matchesView(transaction: Transaction, scope: Scope, status: Status): boolean {
  if (scope === 'income') return transaction.kind === 'income'

  return matchesStatus(transaction, status)
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
