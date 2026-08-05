import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import type { Direction, NewTransaction, Transaction } from '../../services/types'

/**
 * Query keys are built here rather than inline so an invalidation cannot miss a
 * cache by spelling the key differently at the call site.
 */
export const transactionKeys = {
  month: (month: string) => ['transactions', month] as const,
  summary: (month: string) => ['summary', month] as const,
  months: ['months'] as const,
}

/** Months holding data, newest first. Drives the month picker's range. */
export function useMonthsWithData() {
  return useQuery({
    queryKey: transactionKeys.months,
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
    mutationFn: (input: NewTransaction) => services.transactions.create(input),
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
    client.invalidateQueries({ queryKey: transactionKeys.months }),
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
    mutationFn: ({ id, input }: { id: string; input: Partial<NewTransaction> }) =>
      services.transactions.update(id, input),
    onSuccess: () => invalidate(client, month),
  })
}

export function useDeleteTransaction(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.transactions.remove(id),
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
export function useResolveCategory() {
  const client = useQueryClient()

  return async (name: string | null, kind: Direction): Promise<string | null> => {
    if (!name) return null

    const category = await services.categories.findOrCreate(name, kind)

    await client.invalidateQueries({ queryKey: ['categories'] })

    return category.id
  }
}
