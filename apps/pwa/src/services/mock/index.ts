import type { Services } from '@/services/ports'
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
} from '@/services/types'
import { monthKey, todayIso } from '@/lib/dates'
import { getActiveLedgerId, setActiveLedgerId } from '@/services/activeLedger'
import { uuid } from '@/lib/uuid'
import { occurrences } from '@/features/transactions/recurrence'
import { fold } from '@/lib/text'
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
  you: true,
}

let ledgerList: Ledger[] = [
  {
    id: SEED_LEDGER,
    name: 'Conta Pessoal',
    member_count: 1,
    role: 'owner',
    owner_name: you.name,
    owner_email: you.email,
  },
]

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

/**
 * The mock ignores `Fetching`, and that is not an oversight: there is nothing in
 * memory to abandon. The parameter exists here so the signature is the one the
 * HTTP client will have, and so every call site is already passing a signal on
 * the day that client arrives — a seam that only fits after both sides are
 * written is a seam that gets widened by hand under pressure.
 */
export function createMockServices(): Services {
  return {
    ledgers: {
      list: () => delay(ledgerList),

      create: (name) => {
        const created: Ledger = {
          id: uuid(),
          name: name.trim(),
          member_count: 1,
          role: 'owner',
          owner_name: you.name,
          owner_email: you.email,
        }

        ledgerList = [...ledgerList, created]
        ledgerData = { ...ledgerData, [created.id]: emptyLedger() }

        return delay(created)
      },

      members: (ledgerId) => delay(ledgerData[ledgerId]?.members ?? []),

      // The token is dropped on the way out, the way the server drops it: it
      // keeps only a digest, so an invite read back has no link to rebuild. The
      // mock has the token right there and hides it anyway — a mock that is
      // more generous than the API is a mock that lets a screen be built on
      // something that will not be there.
      invites: (ledgerId) =>
        delay((ledgerData[ledgerId]?.invites ?? []).map((invite) => ({ ...invite, token: null }))),

      createInvite: (ledgerId) => {
        // Stand-in only. The real token is minted by the server from a
        // cryptographic source and stored as a digest — see
        // docs/decisions/0002-server-minted-secrets.md. A client has no business
        // choosing a value that lets someone into a ledger.
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

      removeMember: (ledgerId, memberId) => {
        const target = ledgerData[ledgerId]

        if (target) {
          const members = target.members.filter(
            (member) => member.id !== memberId || member.role === 'owner',
          )

          ledgerData = { ...ledgerData, [ledgerId]: { ...target, members } }
          ledgerList = ledgerList.map((ledger) =>
            ledger.id === ledgerId ? { ...ledger, member_count: members.length } : ledger,
          )
        }

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

      reorder: (ids) => {
        const accounts = data().accounts
        const named = ids.map((id) => accounts.find((a) => a.id === id)).filter((a) => a !== undefined)
        const rest = accounts.filter((a) => !ids.includes(a.id))

        patch({ accounts: [...named, ...rest] })

        return delay(data().accounts.filter((a) => a.archived_at === null))
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

      findOrCreate: (name, kind, icon) => {
        const normalized = name.trim()
        const existing = data().categories.find(
          (c) => c.kind === kind && fold(c.name) === fold(normalized),
        )

        if (existing) return delay(existing)

        const created: Category = {
          id: uuid(),
          name: normalized,
          kind,
          icon: icon ?? null,
          color: null,
        }

        patch({ categories: [...data().categories, created] })

        return delay(created)
      },

      update: (id, input) => {
        patch({
          categories: data().categories.map((c) =>
            c.id === id ? { ...c, name: input.name.trim(), icon: input.icon } : c,
          ),
        })

        return delay(data().categories.find((c) => c.id === id)!)
      },

      remove: (id) => {
        patch({
          categories: data().categories.filter((c) => c.id !== id),
          transactions: data().transactions.map((t) =>
            t.category_id === id ? { ...t, category_id: null } : t,
          ),
        })

        return delay(undefined)
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

      monthlyTotals: (categoryId): Promise<MonthTotal[]> => {
        const byMonth = new Map<string, MonthTotal>()
        const rows =
          categoryId == null
            ? data().transactions
            : data().transactions.filter((t) => (t.category_id ?? 'none') === categoryId)

        for (const row of rows) {
          const key = monthKey(row.date)
          const entry = byMonth.get(key) ?? { month: key, expense_cents: 0, income_cents: 0 }

          if (row.kind === 'expense') {
            entry.expense_cents += row.amount_cents
          } else {
            entry.income_cents += row.amount_cents
          }

          byMonth.set(key, entry)
        }

        return delay([...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)))
      },

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

      create: (input: NewTransaction, recurrence) => {
        const series = recurrence ? uuid() : null
        const dates = recurrence ? occurrences(input.date, recurrence) : [input.date]

        const rows: Transaction[] = dates.map((date, index) => ({
          id: uuid(),
          account_id: input.account_id,
          category_id: input.category_id,
          kind: input.kind,
          amount_cents: input.amount_cents,
          date,
          // Only the first one can already be settled. The rest have not
          // happened yet, and a future row marked paid is a claim about a month
          // nobody has lived through.
          paid_at: index === 0 && input.paid ? new Date().toISOString() : null,
          description: input.description,
          recurring_series_id: series,
          created_by_id: you.id,
          detached: false,
        }))

        patch({ transactions: [...data().transactions, ...rows] })

        return delay(rows[0])
      },

      update: (id, input, scope = 'one') => {
        const target = find(id)
        const changes = stripPaid(input)

        patch({
          transactions: data().transactions.map((row) => {
            if (row.id === id) {
              // Editing one on its own detaches it, so a later change to the
              // series leaves the correction alone.
              return { ...row, ...changes, detached: scope === 'one' ? true : row.detached }
            }

            if (scope !== 'future' || !affects(row, target)) return row

            // The date belongs to the occurrence, never to the series edit: a
            // rule change must not drag October's row onto September's day.
            return { ...row, ...withoutDate(changes) }
          }),
        })

        return delay(find(id))
      },

      repeat: (id, recurrence) => {
        const target = find(id)

        if (target.recurring_series_id) return delay(undefined)

        const series = uuid()
        // The first date is the row that already exists; only what comes after
        // it is written.
        const dates = occurrences(target.date, recurrence).slice(1)

        const rows: Transaction[] = dates.map((date) => ({
          ...target,
          id: uuid(),
          date,
          paid_at: null,
          recurring_series_id: series,
          detached: false,
        }))

        patch({
          transactions: [
            ...data().transactions.map((row) =>
              row.id === id ? { ...row, recurring_series_id: series } : row,
            ),
            ...rows,
          ],
        })

        return delay(undefined)
      },

      remove: (id, scope = 'one') => {
        const target = find(id)

        patch({
          transactions: data().transactions.filter((row) => {
            if (row.id === id) return false

            return scope !== 'future' || !affects(row, target)
          }),
        })

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

/**
 * Whether a change to `target` reaches `row`.
 *
 * Same series, later date, and not detached. The past is excluded by the date
 * comparison rather than by a rule about today: what matters is the occurrence
 * being edited, so editing September's row leaves August alone even if both are
 * behind us.
 */
function withoutDate(changes: Partial<Transaction>): Partial<Transaction> {
  const rest = { ...changes }

  delete rest.date

  return rest
}

function affects(row: Transaction, target: Transaction): boolean {
  if (!target.recurring_series_id) return false

  if (row.recurring_series_id !== target.recurring_series_id) return false

  if (row.detached) return false

  return row.date > target.date
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
