import { createContext, use } from 'react'
import type { Ledger } from '../../services/types'

export const ledgerKeys = {
  list: ['ledgers'] as const,
  members: (id: string) => ['ledgers', id, 'members'] as const,
  invites: (id: string) => ['ledgers', id, 'invites'] as const,
}

export interface ActiveLedger {
  /** Null only while the list is still loading. Screens wait for it. */
  ledgerId: string | null
  ledgers: Ledger[]
  shared: boolean
  current: Ledger | null
  switchTo: (id: string) => void
}

export const ActiveLedgerContext = createContext<ActiveLedger | null>(null)

export function useActiveLedger(): ActiveLedger {
  const value = use(ActiveLedgerContext)

  if (!value) {
    throw new Error('useActiveLedger precisa estar dentro de ActiveLedgerProvider')
  }

  return value
}
