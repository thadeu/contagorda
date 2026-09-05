import type { Cents } from '@/lib/money'
import type { Recurrence } from '@/features/transactions/recurrence'
import { request } from '@/services/http'
import type { NewAccount, Scope, Services } from '@/services/ports'
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

/**
 * The ports, over HTTP.
 *
 * Thin on purpose. Everything that is true of every call — the token, the
 * ledger header, the idempotency key, the error envelope — lives in `http.ts`,
 * so each method here is a URL and a shape. Anything cleverer than that would
 * be a second place for the contract to drift from `docs/api/endpoints.md`.
 */
export function createApiServices(): Services {
  return {
    ledgers: {
      list: (options) => request<Ledger[]>('/ledgers', options),

      create: (name) => request<Ledger>('/ledgers', { method: 'POST', body: { name } }),

      members: (ledgerId, options) =>
        request<LedgerMember[]>(`/ledgers/${ledgerId}/members`, options),

      invites: (ledgerId, options) =>
        request<LedgerInvite[]>(`/ledgers/${ledgerId}/invites`, options),

      // The only moment the token exists outside whoever holds the link: it is
      // stored as a digest, so listing invites cannot produce it again.
      createInvite: (ledgerId) =>
        request<LedgerInvite>(`/ledgers/${ledgerId}/invites`, { method: 'POST' }),

      revokeInvite: (id) => request<void>(`/invites/${id}`, { method: 'DELETE' }),

      removeMember: (ledgerId, memberId) =>
        request<void>(`/ledgers/${ledgerId}/members/${memberId}`, { method: 'DELETE' }),

      acceptInvite: (token) =>
        request<Ledger>(`/invites/${encodeURIComponent(token)}/accept`, { method: 'POST' }),
    },

    profile: {
      get: (options) => request<{ display_name: string | null }>('/me', options),

      update: (input) =>
        request<{ display_name: string | null }>('/me', { method: 'PATCH', body: input }),
    },

    accounts: {
      list: (options) => request<Account[]>('/accounts', options),

      create: (input: NewAccount) =>
        request<Account>('/accounts', { method: 'POST', body: input, idempotent: true }),

      update: (id, input) => request<Account>(`/accounts/${id}`, { method: 'PATCH', body: input }),

      archive: (id) => request<void>(`/accounts/${id}/archive`, { method: 'POST' }),

      reorder: (ids) => request<Account[]>('/accounts/order', { method: 'PUT', body: { ids } }),

      // A missing key means zero. The server sends only what somebody set, and
      // writing every account out with a zero would invent a decision nobody
      // made.
      openingBalances: (month, options) =>
        request<Record<string, Cents>>('/accounts/opening_balances', {
          ...options,
          query: { month },
        }),

      setOpeningBalance: (accountId, month, cents) =>
        request<void>(`/accounts/${accountId}/opening_balances/${month}`, {
          method: 'PUT',
          body: { cents },
        }),
    },

    categories: {
      list: (options) => request<Category[]>('/categories', options),

      // Creation is a match first: the server folds the name past its accents
      // and its case, so "Farmácia" typed twice lands on one row.
      findOrCreate: (name, kind, icon) =>
        request<Category>('/categories', {
          method: 'POST',
          body: { name, kind, icon },
          idempotent: true,
        }),

      update: (id, input) => request<Category>(`/categories/${id}`, { method: 'PATCH', body: input }),

      remove: (id) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
    },

    transactions: {
      listByMonth: (month, options) =>
        request<Transaction[]>('/transactions', { ...options, query: { month } }),

      search: (term, options) => request<Transaction[]>('/search', { ...options, query: { q: term } }),

      summary: (month, options) => request<MonthSummary>(`/months/${month}/summary`, options),

      months: (options) => request<string[]>('/months', options),

      monthlyTotals: (categoryId, options) =>
        request<MonthTotal[]>('/monthly_totals', { ...options, query: { category_id: categoryId } }),

      // The rule goes with the row, and the server writes every occurrence in
      // one transaction. A series that materialised halfway would show up as a
      // bill that stops in April for no reason anybody could find.
      create: (input: NewTransaction, recurrence?: Recurrence | null) =>
        request<Transaction>('/transactions', {
          method: 'POST',
          body: { ...input, recurrence: recurrence ?? null },
          idempotent: true,
        }),

      update: (id, input, scope: Scope = 'one') =>
        request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: { ...input, scope } }),

      remove: (id, scope: Scope = 'one') =>
        request<void>(`/transactions/${id}`, { method: 'DELETE', query: { scope } }),

      repeat: (id, recurrence) =>
        request<void>(`/transactions/${id}/recurrence`, { method: 'POST', body: recurrence }),

      // The client says *that* it was paid; the server says *when*.
      setPaid: (id, paid) =>
        request<Transaction>(`/transactions/${id}/settlement`, { method: 'PUT', body: { paid } }),
    },
  }
}
