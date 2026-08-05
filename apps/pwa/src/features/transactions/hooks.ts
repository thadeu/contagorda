import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import type { NewTransaction, Transaction } from '../../services/types'

/**
 * Query keys are built here rather than inline so an invalidation cannot miss a
 * cache by spelling the key differently at the call site.
 */
export const transactionKeys = {
  month: (month: string) => ['transactions', month] as const,
  summary: (month: string) => ['summary', month] as const,
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
  ])
}
