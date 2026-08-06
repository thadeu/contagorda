import type { Services } from '../ports'
import type {
  Account,
  Category,
  Ledger,
  LedgerInvite,
  LedgerMember,
  MonthSummary,
  NewTransaction,
  Transaction,
} from '../types'
import { monthKey, todayIso } from '../../lib/dates'
import { getActiveLedgerId, setActiveLedgerId } from '../activeLedger'
import {
  accounts as seedAccounts,
  categories as seedCategories,
  transactions as seed,
} from './fixtures'

/**
 * In-memory implementation of the ports.
 *
 * State is module-level and mutable on purpose: it makes create, edit and
 * delete behave the way they will against a real API, so the screens are built
 * against something that actually changes rather than against a frozen list.
 *
 * Everything except ledgers themselves is stored per ledger. That is not
 * decoration for the mock — it is the shape of the real schema, where every
 * table carries a `ledger_id` and no query runs without it. Building the screens
 * against a single flat store would let them read data no scoping rule allows,
 * and the day the API arrived they would all be subtly wrong at once.
 *
 * The latency is not decoration either. Without it every request resolves
 * before the first paint, loading and empty states never render, and they ship
 * broken.
 */

interface LedgerData {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  /** Opening balances, keyed `${accountId}:${month}`. Missing means zero. */
  opening: Record<string, number>
  members: LedgerMember[]
  invites: LedgerInvite[]
}

const SEED_LEDGER = '019fce00-0000-7000-8000-0000000000f1'

const LATENCY_MS = 180

const you: LedgerMember = {
  id: '019fce00-0000-7000-8000-0000000000e1',
  name: 'Você',
  email: 'voce@exemplo.com',
  role: 'owner',
}

let ledgerList: Ledger[] = [{ id: SEED_LEDGER, name: 'Nossa casa', member_count: 1 }]

let ledgerData: Record<string, LedgerData> = {
  [SEED_LEDGER]: {
    transactions: [...seed],
    accounts: [...seedAccounts],
    categories: [...seedCategories],
    opening: {
      [`${seedAccounts[0].id}:${monthKey(todayIso())}`]: 250_000,
      [`${seedAccounts[2].id}:${monthKey(todayIso())}`]: 12_000,
    },
    members: [you],
    invites: [],
  },
}

let profileStore: { display_name: string | null } = { display_name: null }

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

function uuid(): string {
  return crypto.randomUUID()
}

function emptyLedger(): LedgerData {
  return {
    transactions: [],
    accounts: [],
    categories: [],
    opening: {},
    members: [you],
    invites: [],
  }
}

/**
 * The active ledger's data. Falls back to the seed one so the app has something
 * to show before a ledger has been chosen — the first render of a first load.
 */
function data(): LedgerData {
  const id = getActiveLedgerId() ?? SEED_LEDGER

  ledgerData[id] ??= emptyLedger()

  return ledgerData[id]
}

function patch(next: Partial<LedgerData>): void {
  const id = getActiveLedgerId() ?? SEED_LEDGER

  ledgerData = { ...ledgerData, [id]: { ...data(), ...next } }
}

function inMonth(month: string) {
  return (t: Transaction) => monthKey(t.date) === month
}

function byDateThenCreation(a: Transaction, b: Transaction): number {
  return a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)
}

export function createMockServices(): Services {
  return {
    ledgers: {
      list: () => delay(ledgerList),

      create: (name) => {
        const created: Ledger = { id: uuid(), name: name.trim(), member_count: 1 }

        ledgerList = [...ledgerList, created]
        ledgerData = { ...ledgerData, [created.id]: emptyLedger() }

        return delay(created)
      },

      members: (ledgerId) => delay(ledgerData[ledgerId]?.members ?? []),

      invites: (ledgerId) => delay(ledgerData[ledgerId]?.invites ?? []),

      createInvite: (ledgerId) => {
        const created: LedgerInvite = {
          id: uuid(),
          token: uuid(),
          expires_at: inDays(7),
          revoked_at: null,
          accepted_at: null,
        }

        const target = ledgerData[ledgerId] ?? emptyLedger()

        ledgerData = {
          ...ledgerData,
          [ledgerId]: { ...target, invites: [...target.invites, created] },
        }

        return delay(created)
      },

      revokeInvite: (id) => {
        ledgerData = Object.fromEntries(
          Object.entries(ledgerData).map(([key, value]) => [
            key,
            {
              ...value,
              invites: value.invites.map((invite) =>
                invite.id === id ? { ...invite, revoked_at: new Date().toISOString() } : invite,
              ),
            },
          ]),
        )

        return delay(undefined)
      },

      acceptInvite: (token) => {
        const entry = Object.entries(ledgerData).find(([, value]) =>
          value.invites.some((invite) => usable(invite) && invite.token === token),
        )

        if (!entry) {
          return Promise.reject(new Error('Convite inválido ou expirado.'))
        }

        const [ledgerId, value] = entry
        const joined = ledgerList.find((ledger) => ledger.id === ledgerId)!

        ledgerData = {
          ...ledgerData,
          [ledgerId]: {
            ...value,
            invites: value.invites.map((invite) =>
              invite.token === token ? { ...invite, accepted_at: new Date().toISOString() } : invite,
            ),
          },
        }

        setActiveLedgerId(ledgerId)

        return delay(joined)
      },
    },

    profile: {
      get: () => delay(profileStore),

      update: ({ display_name }) => {
        const trimmed = display_name.trim()

        profileStore = { display_name: trimmed === '' ? null : trimmed }

        return delay(profileStore)
      },
    },

    accounts: {
      list: () => delay(data().accounts.filter((a) => a.archived_at === null)),

      create: (input) => {
        const created = { id: uuid(), archived_at: null, ...input }

        patch({ accounts: [...data().accounts, created] })

        return delay(created)
      },

      update: (id, input) => {
        patch({ accounts: data().accounts.map((a) => (a.id === id ? { ...a, ...input } : a)) })

        return delay(data().accounts.find((a) => a.id === id)!)
      },

      openingBalances: (month) => {
        const entries = Object.entries(data().opening)
          .filter(([key]) => key.endsWith(`:${month}`))
          .map(([key, cents]) => [key.slice(0, key.lastIndexOf(':')), cents] as const)

        return delay(Object.fromEntries(entries))
      },

      setOpeningBalance: (accountId, month, cents) => {
        patch({ opening: { ...data().opening, [`${accountId}:${month}`]: cents } })

        return delay(undefined)
      },

      archive: (id) => {
        patch({
          accounts: data().accounts.map((a) =>
            a.id === id ? { ...a, archived_at: new Date().toISOString() } : a,
          ),
        })

        return delay(undefined)
      },
    },

    categories: {
      list: () => delay(data().categories),

      findOrCreate: (name, kind) => {
        const normalized = name.trim()
        const existing = data().categories.find(
          (c) => c.kind === kind && c.name.toLowerCase() === normalized.toLowerCase(),
        )

        if (existing) return delay(existing)

        const created: Category = { id: uuid(), name: normalized, kind, icon: null, color: null }

        patch({ categories: [...data().categories, created] })

        return delay(created)
      },
    },

    transactions: {
      listByMonth: (month) =>
        delay(data().transactions.filter(inMonth(month)).sort(byDateThenCreation)),

      months: () =>
        delay(
          [...new Set(data().transactions.map((t) => monthKey(t.date)))].sort((a, b) =>
            b.localeCompare(a),
          ),
        ),

      summary: (month): Promise<MonthSummary> => {
        const rows = data().transactions.filter(inMonth(month))
        const today = todayIso()

        const income = sum(rows.filter((t) => t.kind === 'income'))
        const expense = sum(rows.filter((t) => t.kind === 'expense'))
        const upcoming = sum(
          rows.filter((t) => t.kind === 'expense' && !t.paid_at && t.date >= today),
        )

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

        patch({ transactions: [...data().transactions, created] })

        return delay(created)
      },

      update: (id, input) => {
        patch({
          transactions: data().transactions.map((t) =>
            t.id === id ? { ...t, ...stripPaid(input) } : t,
          ),
        })

        return delay(find(id))
      },

      remove: (id) => {
        patch({ transactions: data().transactions.filter((t) => t.id !== id) })

        return delay(undefined)
      },

      setPaid: (id, paid) => {
        patch({
          transactions: data().transactions.map((t) =>
            t.id === id ? { ...t, paid_at: paid ? new Date().toISOString() : null } : t,
          ),
        })

        return delay(find(id))
      },
    },
  }
}

function usable(invite: LedgerInvite): boolean {
  return invite.revoked_at === null && invite.accepted_at === null && invite.expires_at > new Date().toISOString()
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function sum(rows: Transaction[]): number {
  return rows.reduce((total, t) => total + t.amount_cents, 0)
}

function find(id: string): Transaction {
  const found = data().transactions.find((t) => t.id === id)

  if (!found) throw new Error(`transaction ${id} not found`)

  return found
}

function stripPaid(input: Partial<NewTransaction>): Partial<Transaction> {
  const { paid, ...rest } = input

  return paid === undefined ? rest : { ...rest, paid_at: paid ? new Date().toISOString() : null }
}
