import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import type { Scope } from '../../services/ports'
import type { Recurrence } from './recurrence'
import { getActiveLedgerId } from '../../services/activeLedger'
import { categoryKeys } from '../accounts/hooks'
import type { Direction, NewTransaction, Transaction } from '../../services/types'

/**
 * Query keys are built here rather than inline so an invalidation cannot miss a
 * cache by spelling the key differently at the call site.
 *
 * Every key carries the ledger, read from the same ambient value the request
 * itself will carry — so a key and its invalidation can never disagree about
 * which ledger they meant. Switching also clears the cache; this is the layer
 * underneath that, for a request already in flight when the switch happened.
 */
export const transactionKeys = {
  month: (month: string) => ['transactions', getActiveLedgerId(), month] as const,
  summary: (month: string) => ['summary', getActiveLedgerId(), month] as const,
  months: () => ['months', getActiveLedgerId()] as const,
  totals: (categoryId: string | null) =>
    ['monthly-totals', getActiveLedgerId(), categoryId] as const,
}

/** One row per month that holds anything, oldest first. Draws the history chart. */
export function useMonthlyTotals(categoryId: string | null = null) {
  return useQuery({
    queryKey: transactionKeys.totals(categoryId),
    queryFn: () => services.transactions.monthlyTotals(categoryId),
  })
}

/** Months holding data, newest first. Drives the month picker's range. */
export function useMonthsWithData() {
  return useQuery({
    queryKey: transactionKeys.months(),
    queryFn: () => services.transactions.months(),
  })
}

export function useTransactions(month: string) {
  return useQuery({
    queryKey: transactionKeys.month(month),
    queryFn: () => services.transactions.listByMonth(month),
  })
}

export function useMonthSummary(month: string) {
  return useQuery({
    queryKey: transactionKeys.summary(month),
    queryFn: () => services.transactions.summary(month),
  })
}

export function useCreateTransaction(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ input, recurrence }: { input: NewTransaction; recurrence: Recurrence | null }) =>
      services.transactions.create(input, recurrence),
    onSuccess: () => invalidate(client, month),
  })
}

/**
 * Marking something paid is the most repeated action in the app, so it updates
 * the cache immediately and reconciles afterwards. Waiting for a round trip
 * makes a tap feel broken on a phone.
 */
export function useTogglePaid(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => services.transactions.setPaid(id, paid),

    onMutate: async ({ id, paid }) => {
      const key = transactionKeys.month(month)

      await client.cancelQueries({ queryKey: key })

      const previous = client.getQueryData<Transaction[]>(key)

      client.setQueryData<Transaction[]>(key, (rows) =>
        rows?.map((t) => (t.id === id ? { ...t, paid_at: paid ? new Date().toISOString() : null } : t)),
      )

      return { previous }
    },

    // Put the old list back rather than leaving the UI asserting something the
    // server rejected.
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(transactionKeys.month(month), context.previous)
    },

    onSettled: () => invalidate(client, month),
  })
}

function invalidate(client: ReturnType<typeof useQueryClient>, month: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: transactionKeys.month(month) }),
    client.invalidateQueries({ queryKey: transactionKeys.summary(month) }),
    // The first entry in a month has to make that month appear in the picker,
    // and deleting the last one has to take it out again.
    client.invalidateQueries({ queryKey: transactionKeys.months() }),
    client.invalidateQueries({ queryKey: ['monthly-totals', getActiveLedgerId()] }),
  ])
}

/**
 * Reads one transaction out of the month already in cache instead of fetching
 * it. The edit screen is always reached from a list that just loaded, so a
 * separate request would show a spinner over data the app already has.
 */
export function useTransaction(month: string, id: string): Transaction | undefined {
  const { data } = useTransactions(month)

  return data?.find((t) => t.id === id)
}

export function useUpdateTransaction(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
      scope,
    }: {
      id: string
      input: Partial<NewTransaction>
      scope?: Scope
    }) => services.transactions.update(id, input, scope),
    onSuccess: () => invalidate(client, month),
  })
}

export function useDeleteTransaction(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, scope }: { id: string; scope?: Scope }) =>
      services.transactions.remove(id, scope),
    onSuccess: () => invalidate(client, month),
  })
}

/**
 * Resolves a typed category name into an id before saving the transaction.
 *
 * Matching happens server-side by name so the same word typed twice reuses one
 * category — otherwise every report would split across entries that look
 * identical on screen.
 */
export function useUpdateCategory() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name, icon }: { id: string; name: string; icon: string | null }) =>
      services.categories.update(id, { name, icon }),
    onSuccess: () => client.invalidateQueries({ queryKey: categoryKeys.all() }),
  })
}

/** Removing a category leaves its transactions uncategorised, so they reload too. */
export function useDeleteCategory() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.categories.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: categoryKeys.all() })
      void client.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useCreateCategory() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ name, kind, icon }: { name: string; kind: Direction; icon: string | null }) =>
      services.categories.findOrCreate(name, kind, icon),
    onSuccess: () => client.invalidateQueries({ queryKey: categoryKeys.all() }),
  })
}
