import type { Cents } from '../lib/money'
import type { IsoDate } from '../lib/dates'

/**
 * The shapes the UI consumes. They deliberately match what the API will send —
 * snake_case, cents as integers, dates as ISO strings, ids as UUIDs — so
 * swapping the mock for HTTP is a change of implementation and not a change of
 * contract. A mock that invents a friendlier shape only moves the translation
 * work to the day you can least afford it.
 */

export type Direction = 'expense' | 'income'

export type AccountKind = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  institution: string | null
  archived_at: string | null
}

export interface Category {
  id: string
  name: string
  kind: Direction
  icon: string | null
  color: string | null
}

export interface Transaction {
  id: string
  account_id: string
  category_id: string | null
  kind: Direction
  amount_cents: Cents
  date: IsoDate
  description: string
  paid_at: string | null
  recurring_series_id: string | null
}

export interface MonthSummary {
  month: string
  income_cents: Cents
  expense_cents: Cents
  /** income − expense. Signed, so the UI never recomputes the direction. */
  net_cents: Cents
  /** What is still unpaid and dated in the future. Drives "what is coming". */
  upcoming_cents: Cents
}

export interface NewTransaction {
  account_id: string
  category_id: string | null
  kind: Direction
  amount_cents: Cents
  date: IsoDate
  description: string
  paid: boolean
}
