import { useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { getActiveLedgerId, setActiveLedgerId } from '@/services/activeLedger'
import { ActiveLedgerContext, ledgerKeys, type ActiveLedger } from './activeLedgerContext'

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

  if (current === null) {
    return null
  }

  return <ActiveLedgerContext value={value}>{children}</ActiveLedgerContext>
}
