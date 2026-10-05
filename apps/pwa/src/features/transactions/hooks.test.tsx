import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { getActiveLedgerId } from '@/services/activeLedger'
import { monthKey, shiftMonth, todayIso } from '@/lib/dates'
import { services } from '@/services'
import { transactionKeys, useUpdateTransaction } from './hooks'

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return { client, wrapper }
}

describe('after a write', () => {
  /**
   * A series writes into months that are not open, and an edit that reaches the
   * ones after it changes them. Renewing only the month on screen left the next
   * one showing what it had — an edit that looked as if it had not been applied.
   */
  it('marks every month stale, not just the one on screen', async () => {
    const { client, wrapper } = setup()
    const thisMonth = monthKey(todayIso())
    const next = shiftMonth(thisMonth, 1)
    const later = shiftMonth(thisMonth, 5)
    const [row] = await services.transactions.listByMonth(thisMonth)

    for (const month of [thisMonth, next, later]) {
      client.setQueryData(transactionKeys.month(month), [])
    }

    const { result } = renderHook(() => useUpdateTransaction(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: row.id, input: { amount_cents: 1_234 }, scope: 'future' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    for (const month of [thisMonth, next, later]) {
      expect(client.getQueryState(transactionKeys.month(month))?.isInvalidated).toBe(true)
    }

    expect(getActiveLedgerId()).toBeDefined()
  })
})
