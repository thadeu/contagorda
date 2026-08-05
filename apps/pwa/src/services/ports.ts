import type { Account, Category, MonthSummary, NewTransaction, Transaction } from './types'

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
  initial_balance_cents: number
}

export interface AccountsPort {
  list(): Promise<Account[]>
  create(input: NewAccount): Promise<Account>
  update(id: string, input: Partial<NewAccount>): Promise<Account>
  /** Archived, never deleted: the transactions pointing at it are history. */
  archive(id: string): Promise<void>
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

export interface Services {
  transactions: TransactionsPort
  accounts: AccountsPort
  categories: CategoriesPort
}
