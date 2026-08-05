import { useSearchParams } from 'react-router'
import type { Transaction } from '../../services/types'

export type Status = 'pending' | 'paid'

const PARAM = 'status'

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

  function setStatus(next: Status) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)

        updated.set(PARAM, next)

        return updated
      },
      { replace: true },
    )
  }

  return { status, setStatus }
}

export function matchesStatus(transaction: Transaction, status: Status): boolean {
  return status === 'paid' ? transaction.paid_at !== null : transaction.paid_at === null
}

/**
 * Pending sorts soonest-first so anything overdue sits at the top, where it is
 * the first thing read. Paid sorts newest-first, because looking at what is
 * done is looking at what just happened.
 */
export function orderFor(status: Status): 'asc' | 'desc' {
  return status === 'pending' ? 'asc' : 'desc'
}
