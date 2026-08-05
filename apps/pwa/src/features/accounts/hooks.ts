import { useQuery } from '@tanstack/react-query'
import { services } from '../../services'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: () => services.accounts.list() })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => services.categories.list() })
}
