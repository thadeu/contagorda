import type { Cents } from '@/lib/money'
import type { Transaction } from '@/services/types'

/**
 * Where an account stands part-way through a month.
 *
 * Starts from what it held at the start of the month and applies only what has
 * settled. Unpaid rows are a plan, and a balance that counts plans is a forecast
 * wearing the same clothes — which is exactly the number someone checks before
 * spending.
 *
 * The month is not filtered here: the rows handed in are already a month's
 * worth, and filtering again would mean this function needed to know how a month
 * is decided.
 */
export function balanceFor(
  accountId: string,
  openingCents: Cents,
  rows: Transaction[],
): Cents {
  return rows
    .filter((row) => row.account_id === accountId && row.paid_at !== null)
    .reduce(
      (total, row) => total + (row.kind === 'income' ? row.amount_cents : -row.amount_cents),
      openingCents,
    )
}
