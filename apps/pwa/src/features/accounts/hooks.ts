import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import { getActiveLedgerId } from '../../services/activeLedger'
import type { NewAccount } from '../../services/ports'

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
