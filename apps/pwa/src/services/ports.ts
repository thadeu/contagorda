import type { Cents } from '../lib/money'
import type {
  Account,
  Category,
  Ledger,
  LedgerInvite,
  LedgerMember,
  MonthSummary,
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
 * None of these take a ledger. The active one is ambient — see `activeLedger` —
 * because that is what it will be over HTTP, where it rides on a header set once
 * by the client. Threading it through every signature here would invent a
 * parameter the API does not have and let a screen pass the wrong one.
 */

export interface TransactionsPort {
  listByMonth(month: string): Promise<Transaction[]>
  summary(month: string): Promise<MonthSummary>
  /**
   * Every month holding at least one transaction, newest first.
   *
   * The month picker is built from this rather than from a fixed window: a
   * range guessed in the client either hides months that exist or offers empty
   * ones that lead nowhere.
   */
  months(): Promise<string[]>
  create(input: NewTransaction): Promise<Transaction>
  update(id: string, input: Partial<NewTransaction>): Promise<Transaction>
  remove(id: string): Promise<void>
  setPaid(id: string, paid: boolean): Promise<Transaction>
}

export interface NewAccount {
  name: string
  kind: Account['kind']
  institution: string | null
}

export interface AccountsPort {
  list(): Promise<Account[]>
  create(input: NewAccount): Promise<Account>
  update(id: string, input: Partial<NewAccount>): Promise<Account>
  /** Archived, never deleted: the transactions pointing at it are history. */
  archive(id: string): Promise<void>
  /**
   * What each account holds at the start of a month, keyed by account id.
   *
   * A balance belongs to a month, not to the account. An account carries one
   * number for its whole life only until the second month arrives, and then
   * every figure derived from it is wrong in a way nobody can see. An account
   * missing from the map has not been opened for that month yet and starts at
   * zero, which is a real answer rather than an error.
   */
  openingBalances(month: string): Promise<Record<string, Cents>>
  setOpeningBalance(accountId: string, month: string, cents: Cents): Promise<void>
}

export interface CategoriesPort {
  list(): Promise<Category[]>
  /**
   * Creating from the transaction form is the main path, so this matches on
   * name first — typing "Farmácia" twice has to reuse the category rather than
   * quietly build a second one that splits every future report.
   */
  findOrCreate(name: string, kind: Category['kind']): Promise<Category>
}

export interface LedgersPort {
  /** Every ledger this person is a member of. Never empty: signing up makes one. */
  list(): Promise<Ledger[]>
  create(name: string): Promise<Ledger>
  members(ledgerId: string): Promise<LedgerMember[]>
  invites(ledgerId: string): Promise<LedgerInvite[]>
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
  get(): Promise<{ display_name: string | null }>
  update(input: { display_name: string }): Promise<{ display_name: string | null }>
}

export interface Services {
  transactions: TransactionsPort
  accounts: AccountsPort
  categories: CategoriesPort
  profile: ProfilePort
  ledgers: LedgersPort
}
