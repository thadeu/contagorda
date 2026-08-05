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
  create(input: NewTransaction): Promise<Transaction>
  update(id: string, input: Partial<NewTransaction>): Promise<Transaction>
  remove(id: string): Promise<void>
  setPaid(id: string, paid: boolean): Promise<Transaction>
}

export interface AccountsPort {
  list(): Promise<Account[]>
}

export interface CategoriesPort {
  list(): Promise<Category[]>
}

export interface Services {
  transactions: TransactionsPort
  accounts: AccountsPort
  categories: CategoriesPort
}
