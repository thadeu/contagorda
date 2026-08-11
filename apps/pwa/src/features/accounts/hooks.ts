import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { getActiveLedgerId } from '@/services/activeLedger'
import type { NewAccount } from '@/services/ports'
import type { Account } from '@/services/types'

export const accountKeys = {
  all: () => ['accounts', getActiveLedgerId()] as const,
  opening: (month: string) => ['accounts', getActiveLedgerId(), 'opening', month] as const,
}

export const categoryKeys = {
  all: () => ['categories', getActiveLedgerId()] as const,
}

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all(), queryFn: ({ signal }) => services.accounts.list({ signal }) })
}

export function useAccount(id: string) {
  const { data } = useAccounts()

  return data?.find((a) => a.id === id)
}

/**
 * What each account starts the month with. Missing means zero — an account that
 * has not been opened for a month is not an error, it is a new account.
 */
export function useOpeningBalances(month: string) {
  return useQuery({
    queryKey: accountKeys.opening(month),
    queryFn: ({ signal }) => services.accounts.openingBalances(month, { signal }),
  })
}

export function useSetOpeningBalance(month: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, cents }: { accountId: string; cents: number }) =>
      services.accounts.setOpeningBalance(accountId, month, cents),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.opening(month) }),
  })
}

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all(), queryFn: ({ signal }) => services.categories.list({ signal }) })
}

export function useCreateAccount() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: NewAccount) => services.accounts.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all() }),
  })
}

export function useUpdateAccount() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<NewAccount> }) =>
      services.accounts.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all() }),
  })
}

/**
 * Where the person dragged an account to, applied before the server hears about
 * it. A row that springs back to its old place while a request is in flight
 * reads as a gesture that failed, so the cache moves first and the server
 * answers with the list it stored — which is what the cache then keeps.
 */
export function useReorderAccounts() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => services.accounts.reorder(ids),

    onMutate: async (ids) => {
      const key = accountKeys.all()

      await client.cancelQueries({ queryKey: key })

      const previous = client.getQueryData<Account[]>(key)

      client.setQueryData<Account[]>(key, (list) => (list ? inIdOrder(list, ids) : list))

      return { previous }
    },

    // Put the old order back rather than leaving the screen asserting an
    // arrangement the server never accepted.
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(accountKeys.all(), context.previous)
    },

    // The response is the whole list, so there is nothing left to go and ask
    // for — and taking it wholesale is what settles a drag that raced an
    // account created on another device.
    onSuccess: (list) => client.setQueryData(accountKeys.all(), list),
  })
}

/**
 * The same arithmetic the server does, so the optimistic list and the one that
 * comes back agree: named accounts in the order given, anything unnamed keeping
 * its relative place at the end.
 */
function inIdOrder(list: Account[], ids: string[]): Account[] {
  const named = ids.map((id) => list.find((a) => a.id === id)).filter((a) => a !== undefined)
  const rest = list.filter((a) => !ids.includes(a.id))

  return [...named, ...rest]
}

/**
 * Archive, not delete. The transactions pointing at an account are financial
 * history, and closing an account is not a reason for them to lose where they
 * happened.
 */
export function useArchiveAccount() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.accounts.archive(id),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all() }),
  })
}
