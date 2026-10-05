import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/services/types'
import { TransactionRow } from './TransactionRow'

function row(partial: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 13_990,
    date: '2026-10-10',
    description: 'Parcela',
    paid_at: null,
    recurring_series_id: null,
    recurrence: null,
    created_by_id: null,
    detached: false,
    ...partial,
  }
}

function show(transaction: Transaction) {
  render(
    <ul>
      <TransactionRow transaction={transaction} onOpen={vi.fn()} />
    </ul>,
  )
}

describe('TransactionRow', () => {
  it('counts where a recurring row stands, as a tag beside the category', () => {
    show(
      row({
        recurring_series_id: 's',
        recurrence: { frequency: 'monthly', interval: 1, ends_on: '2027-12-10', position: 4, total: 18 },
      }),
    )

    const tag = screen.getByLabelText('4 de 18')

    expect(tag.textContent).toBe('4/18')
    expect(tag.previousElementSibling?.textContent).toBe('Sem categoria')
  })

  it('has no count on a row that stands alone', () => {
    show(row({}))

    expect(screen.queryByText(/\d+\/\d+/)).toBeNull()
  })
})
