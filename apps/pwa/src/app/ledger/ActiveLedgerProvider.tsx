import { useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { getActiveLedgerId, setActiveLedgerId } from '@/services/activeLedger'
import { ActiveLedgerContext, ledgerKeys, type ActiveLedger } from './activeLedgerContext'
import { Unreachable } from './Unreachable'

/**
 * Decides which ledger the app is reading, and makes switching safe.
 *
 * Nothing below renders until the answer is known. Query keys carry the ledger,
 * so a child that mounted first would fetch under whichever id happened to be
 * lying around and cache the result there — right on most loads, wrong on the
 * one where the stored choice no longer exists, and invisible either way.
 *
 * Switching clears the cache. The keys alone would stop anything being served
 * from the wrong ledger, but a request in flight when the switch happens
 * resolves afterwards and lands in a cache the person has already left. Where
 * the two caches are two families' money, a stale figure is not a refresh
 * problem.
 *
 * A stored choice that is no longer a ledger this person belongs to is dropped
 * rather than trusted: access can be taken away while the phone is in a pocket.
 */
export function ActiveLedgerProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const ledgers = useQuery({ queryKey: ledgerKeys.list, queryFn: ({ signal }) => services.ledgers.list({ signal }) })
  const [chosen, setChosen] = useState<string | null>(getActiveLedgerId())

  const available = useMemo(() => ledgers.data ?? [], [ledgers.data])
  const current = available.find((ledger) => ledger.id === chosen) ?? available[0] ?? null

  if (current && getActiveLedgerId() !== current.id) {
    setActiveLedgerId(current.id)
  }

  const value = useMemo<ActiveLedger>(
    () => ({
      ledgerId: current?.id ?? null,
      ledgers: available,
      current,
      shared: available.length > 1 || (current?.member_count ?? 1) > 1,
      switchTo: (id) => {
        if (id === current?.id) return

        setActiveLedgerId(id)
        setChosen(id)
        client.clear()
      },
    }),
    [available, current, client],
  )

  /**
   * Nothing below can render without a ledger, and the two ways of not having
   * one are not the same thing.
   *
   * Still asking: render nothing, the way the boot screen does. It is a moment,
   * and a flash of anything would be worse than a moment of the background.
   *
   * Asked and failed: say so. This used to return `null` here too, and an API
   * that was down produced a blank screen with no explanation and no way
   * forward — which is how it looked on the first deploy, before the API
   * existed at all.
   *
   * An empty list counts as a failure. `GET /ledgers` is never empty by
   * contract — signing up creates one — so an empty answer means something is
   * wrong upstream, and waiting forever for a ledger that is not coming is the
   * one thing not to do.
   */
  if (current === null) {
    if (ledgers.isPending) return null

    return <Unreachable onRetry={() => void ledgers.refetch()} retrying={ledgers.isFetching} />
  }

  return <ActiveLedgerContext value={value}>{children}</ActiveLedgerContext>
}
