import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import type { NewAccount } from '../../services/ports'

export const accountKeys = { all: ['accounts'] as const }

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: () => services.accounts.list() })
}

export function useAccount(id: string) {
  const { data } = useAccounts()

  return data?.find((a) => a.id === id)
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => services.categories.list() })
}

export function useCreateAccount() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (input: NewAccount) => services.accounts.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all }),
  })
}

export function useUpdateAccount() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<NewAccount> }) =>
      services.accounts.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all }),
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
    onSuccess: () => client.invalidateQueries({ queryKey: accountKeys.all }),
  })
}
