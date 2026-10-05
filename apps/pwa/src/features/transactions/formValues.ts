import { formatBRL } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import type { Direction } from '@/services/types'

export interface TransactionFormValues {
  kind: Direction
  amount: string
  description: string
  date: string
  accountId: string
  categoryId: string
  paid: boolean
}

/**
 * Unpaid, until it is marked. Most of what gets entered is a bill still to come,
 * and a form that started on paid made the common case a tap to undo. Paying is
 * the exception that is chosen.
 */
export function emptyValues(): TransactionFormValues {
  return {
    kind: 'expense',
    amount: '',
    description: '',
    date: todayIso(),
    accountId: '',
    categoryId: '',
    paid: false,
  }
}

/** Fills the amount field from a stored value, without the currency prefix. */
export function centsToInput(cents: number): string {
  return formatBRL(cents).replace('R$ ', '')
}
