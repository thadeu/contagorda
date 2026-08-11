import type { Cents } from '@/lib/money'
import type { Recurrence } from '@/features/transactions/recurrence'
import type {
  Account,
  Category,
  Ledger,
  LedgerInvite,
  LedgerMember,
  MonthSummary,
  MonthTotal,
  NewTransaction,
  Transaction,
} from './types'

/**
 * The seam.
 *
 * Everything the UI knows about fetching data is these interfaces. The mock and
 * the eventual HTTP client both implement them, so replacing one with the other
 * touches a single wiring file — no component ever sees a `fetch`, a URL, or a
 * fixture.
 *
 * Keeping this explicit is also how the API contract gets designed: whatever
 * the screens need shows up here first, and the endpoints follow.
 *
 * Reads take a `Fetching`; writes do not. See `Fetching` for why that line is
 * where it is.
 *
 * None of these take a ledger. The active one is ambient — see `activeLedger` —
 * because that is what it will be over HTTP, where it rides on a header set once
 * by the client. Threading it through every signature here would invent a
 * parameter the API does not have and let a screen pass the wrong one.
 */

/**
 * What a read carries besides its arguments.
 *
 * The signal comes from the query that asked, and the client hands it to
 * `fetch`. Abandoning a request is the point: on the history screen a finger can
 * cross a dozen months in a second, and every month it passes over would
 * otherwise leave a request in flight that nobody will read. Nothing goes wrong
 * without it — each month is its own cache entry, so a late answer lands in the
 * right place or nowhere — but the phone spends radio and battery answering
 * questions that were already withdrawn.
 *
 * Only reads take it. A write that has left the client cannot be recalled, only
 * ignored: the server may already have applied it, and a caller that treats an
 * abort as "it did not happen" is a caller that will duplicate the transaction
 * on the retry. Whether a write landed is a question for the next read.
 */
export interface Fetching {
  signal?: AbortSignal
}

export interface TransactionsPort {
  listByMonth(month: string, options?: Fetching): Promise<Transaction[]>
  summary(month: string, options?: Fetching): Promise<MonthSummary>
  /**
   * Every month holding at least one transaction, newest first.
   *
   * The month picker is built from this rather than from a fixed window: a
   * range guessed in the client either hides months that exist or offers empty
   * ones that lead nowhere.
   */
  months(options?: Fetching): Promise<string[]>
  /**
   * Every month that holds anything, with its totals, oldest first.
   *
   * Chart-shaped on purpose: the history view draws one bar per month and needs
   * nothing else, so this is the whole payload rather than a list of ids to
   * follow. It stays cheap as the history grows because the size is months, not
   * transactions.
   *
   * The category narrows the aggregate rather than the result. Filtering a
   * finished total on the client is not possible — the breakdown is gone by
   * then — and fetching every transaction to keep it would give up the one
   * property this call has.
   */
  monthlyTotals(categoryId?: string | null, options?: Fetching): Promise<MonthTotal[]>
  /**
   * A recurrence materialises the whole series at once. The client sends the
   * rule and the server writes the rows, because the dates are derived and a
   * client that computes them can disagree with the next one that does.
   */
  create(input: NewTransaction, recurrence?: Recurrence | null): Promise<Transaction>
  /**
   * `scope` decides how far an edit or a delete reaches.
   *
   * Two values, not three. The past is never touched — a month that has been
   * reconciled does not change because a rule did — so "all occurrences" is not
   * offered. `future` means this one and the ones after it.
   *
   * An occurrence edited on its own is detached and keeps its edit: someone who
   * corrected March's amount did so knowing it differed, and a later change to
   * the series must not quietly undo that.
   */
  update(id: string, input: Partial<NewTransaction>, scope?: Scope): Promise<Transaction>
  remove(id: string, scope?: Scope): Promise<void>
  /**
   * Turns a row that stands alone into the first of a series.
   *
   * Only for one that belongs to none. A row already in a series has occurrences
   * around it that a new rule would have to rewrite — some of them possibly paid
   * — and the honest way to reach those is the scope choice on an edit.
   *
   * The row itself is untouched, including whether it was settled. What follows
   * it is new and unpaid, for the same reason a series created from scratch only
   * settles its first: the rest have not happened.
   */
  repeat(id: string, recurrence: Recurrence): Promise<void>
  setPaid(id: string, paid: boolean): Promise<Transaction>
}

/** How far a change to a recurring row reaches. */
export type Scope = 'one' | 'future'

export interface NewAccount {
  name: string
  kind: Account['kind']
  institution: string | null
}

export interface AccountsPort {
  list(options?: Fetching): Promise<Account[]>
  create(input: NewAccount): Promise<Account>
  update(id: string, input: Partial<NewAccount>): Promise<Account>
  /** Archived, never deleted: the transactions pointing at it are history. */
  archive(id: string): Promise<void>
  /**
   * The whole order, as one write, answering with the list the server stored.
   *
   * Ids rather than positions: dragging one account past two others moves three
   * rows, and a client sending one position per account could land some of them
   * and lose the rest — leaving an order nobody arranged. Where each account
   * sits is the server's arithmetic; this says only what came after what.
   */
  reorder(ids: string[]): Promise<Account[]>
  /**
   * What each account holds at the start of a month, keyed by account id.
   *
   * A balance belongs to a month, not to the account. An account carries one
   * number for its whole life only until the second month arrives, and then
   * every figure derived from it is wrong in a way nobody can see. An account
   * missing from the map has not been opened for that month yet and starts at
   * zero, which is a real answer rather than an error.
   */
  openingBalances(month: string, options?: Fetching): Promise<Record<string, Cents>>
  setOpeningBalance(accountId: string, month: string, cents: Cents): Promise<void>
}

export interface CategoriesPort {
  list(options?: Fetching): Promise<Category[]>
  /**
   * Creating from the transaction form is the main path, so this matches on
   * name first — typing "Farmácia" twice has to reuse the category rather than
   * quietly build a second one that splits every future report. The match sets
   * aside case and accents, because in Portuguese the accent is the first thing
   * to go when someone is typing quickly: `unaccent(lower(name))`, with the
   * unique index built on the same expression.
   *
   * The icon only applies when one is created. A match keeps the icon it already
   * has: the name is the identity, and a second entry of the same category with
   * a different emoji is a preference, not a correction to everything filed
   * under it before.
   */
  findOrCreate(name: string, kind: Category['kind'], icon?: string | null): Promise<Category>
  update(id: string, input: { name: string; icon: string | null }): Promise<Category>
  /**
   * Deleted, not archived — and the transactions filed under it survive as
   * uncategorised.
   *
   * An account is archived because a transaction has to have happened somewhere:
   * erase it and the row is a lie. A category is a label, and a row with no
   * label is still true, just less useful. Keeping dead categories out of every
   * picker forever is a worse trade than losing a word on some old rows.
   */
  remove(id: string): Promise<void>
}

export interface LedgersPort {
  /** Every ledger this person is a member of. Never empty: signing up makes one. */
  list(options?: Fetching): Promise<Ledger[]>
  create(name: string): Promise<Ledger>
  members(ledgerId: string, options?: Fetching): Promise<LedgerMember[]>
  invites(ledgerId: string, options?: Fetching): Promise<LedgerInvite[]>
  /**
   * Mints a link rather than sending mail.
   *
   * The token is the invitation — not the email address it was meant for. An
   * invite tied to an address locks out anyone who signs in with a different
   * one, which is most people: the address you type is rarely the one their
   * Google account carries, and there is no way to repair it afterwards.
   */
  createInvite(ledgerId: string): Promise<LedgerInvite>
  revokeInvite(id: string): Promise<void>
  /**
   * Takes someone's access away. The owner cannot be removed, and neither can
   * you remove yourself here — leaving is a different act with a different
   * confirmation, and conflating them is how a ledger ends up with nobody in it.
   */
  removeMember(ledgerId: string, memberId: string): Promise<void>
  acceptInvite(token: string): Promise<Ledger>
}

export interface ProfilePort {
  /**
   * The name to call this person, when they have chosen one.
   *
   * `null` means they have not, and the identity provider's name stands. Storing
   * a copy of that name instead would freeze it: change it at the provider and
   * the app would keep greeting you by the old one forever, with no way to tell
   * a stale copy from a deliberate choice.
   */
  get(options?: Fetching): Promise<{ display_name: string | null }>
  update(input: { display_name: string }): Promise<{ display_name: string | null }>
}

export interface Services {
  transactions: TransactionsPort
  accounts: AccountsPort
  categories: CategoriesPort
  profile: ProfilePort
  ledgers: LedgersPort
}
