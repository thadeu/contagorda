import { useMutation, useQuery } from '@tanstack/react-query'
import { services } from '@/services'
import { getActiveLedgerId } from '@/services/activeLedger'
import type { MonthClone } from '@/services/types'

/** How often the copy is asked how far it has got. */
export const POLL_MS = 1000

export const monthCloneKeys = {
  one: (id: string) => ['month-clone', getActiveLedgerId(), id] as const,
}

export function useStartMonthClone() {
  return useMutation({
    mutationFn: ({ source, target }: { source: string; target: string }) =>
      services.monthClones.start(source, target),
  })
}

/**
 * Watches a copy until it stops.
 *
 * Polling and not a push, because there is nothing to push over: the API is
 * plain request and response, and the copy takes seconds. The interval ends when
 * the status does — a finished copy asked about forever is a request per second
 * for an answer that cannot change.
 *
 * Starts from the record the request answered with, so the first frame already
 * says "copying" instead of waiting a round trip to learn what it was just told.
 */
export function useMonthClone(initial: MonthClone) {
  return useQuery({
    queryKey: monthCloneKeys.one(initial.id),
    queryFn: ({ signal }) => services.monthClones.get(initial.id, { signal }),
    initialData: initial,
    refetchInterval: (query) => (isFinished(query.state.data) ? false : POLL_MS),
  })
}

export function isFinished(clone: MonthClone | undefined): boolean {
  return clone?.status === 'done' || clone?.status === 'failed'
}
