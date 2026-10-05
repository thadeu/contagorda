import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import type { Transaction } from '@/services/types'
import { TransactionEditorProvider } from '../TransactionEditor'
import { TransactionSheet } from './TransactionSheet'

function row(partial: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 13_990,
    date: '2026-10-10',
    description: 'Dentista',
    paid_at: null,
    recurring_series_id: null,
    recurrence: null,
    created_by_id: null,
    detached: false,
    ...partial,
  }
}

async function open(transaction: Transaction) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ActiveLedgerProvider>
          <TransactionEditorProvider>
            <TransactionSheet
              transaction={transaction}
              onClose={vi.fn()}
              onTogglePaid={vi.fn()}
              onDelete={vi.fn()}
            />
          </TransactionEditorProvider>
        </ActiveLedgerProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  await screen.findByText('Dentista')
}

const monthly = { frequency: 'monthly', interval: 1 } as const
const place = { position: 1, total: 3 }

describe('TransactionSheet on a row of a series', () => {
  it('says how it repeats, until when, and how many come after', async () => {
    await open(row({ recurring_series_id: 's', recurrence: { ...monthly, ends_on: '2026-12-10', ...place } }))

    expect(screen.getByText('Todo mês')).toBeTruthy()
    expect(screen.getByText('Dezembro de 2026')).toBeTruthy()
    expect(screen.getByText('2 lançamentos')).toBeTruthy()
  })

  it('counts from the row being looked at', async () => {
    await open(
      row({
        date: '2026-12-10',
        recurring_series_id: 's',
        recurrence: { ...monthly, ends_on: '2026-12-10', ...place },
      }),
    )

    expect(screen.getByText('Este é o último')).toBeTruthy()
    expect(screen.queryByText('Até')).toBeNull()
  })

  it('reads a series that repeats less often', async () => {
    await open(
      row({
        recurring_series_id: 's',
        recurrence: { frequency: 'monthly', interval: 3, ends_on: '2027-01-10', ...place },
      }),
    )

    expect(screen.getByText('A cada 3 meses')).toBeTruthy()
    expect(screen.getByText('1 lançamento')).toBeTruthy()
  })

  it('shows nothing about repeating on a row that stands alone', async () => {
    await open(row({}))

    expect(screen.queryByText('Repete')).toBeNull()
    expect(screen.queryByText('Depois deste')).toBeNull()
  })
})
