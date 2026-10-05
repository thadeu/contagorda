import type { Cents } from '@/lib/money'
import type { IsoDate } from '@/lib/dates'

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
  /**
   * Who this space belongs to.
   *
   * A ledger somebody shared carries a name they chose for their own list,
   * where it was the only one. In yours it can sit beside a ledger called
   * exactly the same thing, and whose it is answers which is which.
   */
  owner_name: string | null
  owner_email: string | null
}

export interface LedgerMember {
  id: string
  name: string
  email: string
  /** Only an owner may invite or remove. A ledger always keeps one. */
  role: 'owner' | 'member'
  /**
   * Whether this row is the person reading it. Answered by the server: matching
   * the address against the one signed in with would be right nearly always,
   * and nearly always is not what a list of who can see your money needs.
   */
  you: boolean
}

export interface LedgerInvite {
  id: string
  /**
   * What the link carries. Whoever opens it and signs in claims the place.
   *
   * Present only on the invite that was just created, and `null` on every one
   * read back afterwards. The server stores a digest, so an invite it could
   * show again would be an invite it was keeping in the clear — and a leaked
   * table would hand over working invitations. The link is shared at the moment
   * it is minted, or a new one is.
   */
  token: string | null
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

/**
 * How the series a row belongs to repeats.
 *
 * `ends_on` and not a count: how many times it still repeats depends on which
 * row is being looked at, so the client works that out from the row it has open
 * (see `remainingRepeats`). Null when the series has no end recorded.
 */
export interface SeriesRule {
  frequency: 'monthly' | 'yearly'
  interval: number
  ends_on: IsoDate | null
  /**
   * Where this row stands among the rows the series has, in date order, and how
   * many it has. The fourth of eighteen. Counted from what exists, so deleting
   * one renumbers the rest.
   */
  position: number
  total: number
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
  /** The rule of that series, and null for a row that stands alone. */
  recurrence: SeriesRule | null
  /**
   * Which member entered it. Stamped by the server from whoever was
   * authenticated, never sent by the client — otherwise the answer to "who
   * added this" is whatever the app felt like claiming.
   */
  created_by_id: string | null
  /**
   * Set when this row was edited on its own. A later change to the series skips
   * it, because the edit was made knowing it differed.
   */
  detached: boolean
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

export type MonthCloneStatus = 'pending' | 'running' | 'done' | 'failed'

/**
 * A request to copy one month's rows into another, and how far it has got.
 *
 * The copy runs on the server after the request has been answered, so this is
 * what the client holds on to: it asks for it again until the status is `done`
 * or `failed`, and the target month fills in the meantime.
 */
export interface MonthClone {
  id: string
  source_month: string
  target_month: string
  status: MonthCloneStatus
  /** What the copy set out to write. Zero until it has counted. */
  total: number
  copied: number
  /**
   * Rows left out on purpose: those of a series that already wrote into the
   * target, those of a series that is not monthly, and those on an archived
   * account. Said to the person at the end, so a month that came out
   * shorter than the original is not read as a bug.
   */
  skipped: number
}
