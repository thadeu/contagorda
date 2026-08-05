import type { Services } from '../ports'
import type { MonthSummary, NewTransaction, Transaction } from '../types'
import { monthKey, todayIso } from '../../lib/dates'
import { accounts, categories, transactions as seed } from './fixtures'

/**
 * In-memory implementation of the ports.
 *
 * State is module-level and mutable on purpose: it makes create, edit and
 * delete behave the way they will against a real API, so the screens are built
 * against something that actually changes rather than against a frozen list.
 *
 * The latency is not decoration either. Without it every request resolves
 * before the first paint, loading and empty states never render, and they ship
 * broken.
 */
let store: Transaction[] = [...seed]

const LATENCY_MS = 180

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

function uuid(): string {
  return crypto.randomUUID()
}

function inMonth(month: string) {
  return (t: Transaction) => monthKey(t.date) === month
}

function byDateThenCreation(a: Transaction, b: Transaction): number {
  return a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)
}

export function createMockServices(): Services {
  return {
    accounts: {
      list: () => delay(accounts.filter((a) => a.archived_at === null)),
    },

    categories: {
      list: () => delay(categories),
    },

    transactions: {
      listByMonth: (month) => delay(store.filter(inMonth(month)).sort(byDateThenCreation)),

      summary: (month): Promise<MonthSummary> => {
        const rows = store.filter(inMonth(month))
        const today = todayIso()

        const income = sum(rows.filter((t) => t.kind === 'income'))
        const expense = sum(rows.filter((t) => t.kind === 'expense'))
        const upcoming = sum(rows.filter((t) => t.kind === 'expense' && !t.paid_at && t.date >= today))

        return delay({
          month,
          income_cents: income,
          expense_cents: expense,
          net_cents: income - expense,
          upcoming_cents: upcoming,
        })
      },

      create: (input: NewTransaction) => {
        const created: Transaction = {
          id: uuid(),
          account_id: input.account_id,
          category_id: input.category_id,
          kind: input.kind,
          amount_cents: input.amount_cents,
          date: input.date,
          description: input.description,
          paid_at: input.paid ? new Date().toISOString() : null,
          recurring_series_id: null,
        }

        store = [...store, created]

        return delay(created)
      },

      update: (id, input) => {
        const next = store.map((t) => (t.id === id ? { ...t, ...stripPaid(input) } : t))

        store = next

        return delay(find(id))
      },

      remove: (id) => {
        store = store.filter((t) => t.id !== id)

        return delay(undefined)
      },

      setPaid: (id, paid) => {
        store = store.map((t) =>
          t.id === id ? { ...t, paid_at: paid ? new Date().toISOString() : null } : t,
        )

        return delay(find(id))
      },
    },
  }
}

function sum(rows: Transaction[]): number {
  return rows.reduce((total, t) => total + t.amount_cents, 0)
}

function find(id: string): Transaction {
  const found = store.find((t) => t.id === id)

  if (!found) throw new Error(`transaction ${id} not found`)

  return found
}

/** `paid` is an input concept; the stored shape carries `paid_at`. */
function stripPaid(input: Partial<NewTransaction>): Partial<Transaction> {
  const { paid, ...rest } = input

  return paid === undefined ? rest : { ...rest, paid_at: paid ? new Date().toISOString() : null }
}

/** Test seam: lets a spec start from a known store. */
export function resetMockStore(rows: Transaction[] = seed): void {
  store = [...rows]
}
