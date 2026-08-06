import type { Cents } from '../lib/money'
import type { IsoDate } from '../lib/dates'

/**
 * The shapes the UI consumes. They deliberately match what the API will send —
 * snake_case, cents as integers, dates as ISO strings, ids as UUIDs — so
 * swapping the mock for HTTP is a change of implementation and not a change of
 * contract. A mock that invents a friendlier shape only moves the translation
 * work to the day you can least afford it.
 */

/**
 * A ledger is who the data belongs to.
 *
 * Every account, category and transaction lives in one. A person is not the
 * owner of their money here — a ledger is, and people are members of it. That is
 * what lets two phones write to the same month without either of them owning it.
 */
export interface Ledger {
  id: string
  name: string
  /** How many people can see it. Drives whether the app mentions ledgers at all. */
  member_count: number
  /**
   * The viewer's own role here, not the ledger's. The same ledger is owned by
   * one person and joined by another, so this differs per reader — which is why
   * it is answered by the API rather than derived on the client.
   */
  role: 'owner' | 'member'
}

export interface LedgerMember {
  id: string
  name: string
  email: string
  /** Only an owner may invite or remove. A ledger always keeps one. */
  role: 'owner' | 'member'
}

export interface LedgerInvite {
  id: string
  /** What the link carries. Whoever opens it and signs in claims the place. */
  token: string
  expires_at: string
  revoked_at: string | null
  accepted_at: string | null
}

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
  /**
   * Which member entered it. Stamped by the server from whoever was
   * authenticated, never sent by the client — otherwise the answer to "who
   * added this" is whatever the app felt like claiming.
   */
  created_by_id: string | null
}

/**
 * One bar of the history chart.
 *
 * Aggregated by whoever holds the data, never by fetching the months and adding
 * them up here — ten years of imported statements is a hundred and twenty
 * requests and every transaction ever made, to draw a hundred and twenty
 * rectangles.
 */
export interface MonthTotal {
  month: string
  expense_cents: Cents
  income_cents: Cents
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
