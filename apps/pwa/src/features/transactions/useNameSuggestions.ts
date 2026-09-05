import { useQueryClient } from '@tanstack/react-query'
import { getActiveLedgerId } from '@/services/activeLedger'
import type { Direction, Transaction } from '@/services/types'
import { suggestNames, type NameSuggestion } from './suggestions'

/**
 * Suggestions drawn from every month the app already holds.
 *
 * Read straight out of the query cache rather than fetched: the form opens
 * from a month that just loaded, the cache is persisted across launches, and
 * a request for names would be a spinner over data the phone already has. The
 * cost is reach — only months that have been opened count — which is the
 * right trade for a keyboard aid. The API can widen it later if it proves
 * short.
 */
export function useNameSuggestions(query: string, kind: Direction): NameSuggestion[] {
  const client = useQueryClient()

  if (query.trim() === '') return []

  const rows = client
    .getQueriesData<Transaction[]>({ queryKey: ['transactions', getActiveLedgerId()] })
    .flatMap(([, data]) => data ?? [])

  return suggestNames(rows, query, kind)
}
