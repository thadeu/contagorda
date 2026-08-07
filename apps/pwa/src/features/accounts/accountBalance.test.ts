import { describe, expect, it } from 'vitest'
import { balanceFor } from './accountBalance'
import type { Transaction } from '@/services/types'

function row(partial: Partial<Transaction>): Transaction {
  return {
    id: 'x',
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 0,
    date: '2026-08-10',
    description: '',
    paid_at: '2026-08-10T12:00:00Z',
    recurring_series_id: null,
    created_by_id: null,
    detached: false,
    ...partial,
  }
}

describe('balanceFor', () => {
  it('is the opening balance when nothing has happened', () => {
    expect(balanceFor('a', 250_000, [])).toBe(250_000)
  })

  it('starts from zero for an account with no opening balance set', () => {
    expect(balanceFor('a', 0, [row({ kind: 'income', amount_cents: 500_000 })])).toBe(500_000)
  })

  it('adds income and subtracts expenses', () => {
    const rows = [
      row({ kind: 'income', amount_cents: 700_000 }),
      row({ kind: 'expense', amount_cents: 120_000 }),
    ]

    expect(balanceFor('a', 100_000, rows)).toBe(680_000)
  })

  it('ignores what has not been paid yet, so the figure is not a forecast', () => {
    const rows = [
      row({ kind: 'expense', amount_cents: 120_000, paid_at: null }),
      row({ kind: 'income', amount_cents: 700_000, paid_at: null }),
    ]

    expect(balanceFor('a', 100_000, rows)).toBe(100_000)
  })

  it('ignores other accounts', () => {
    const rows = [row({ account_id: 'b', kind: 'expense', amount_cents: 900_000 })]

    expect(balanceFor('a', 100_000, rows)).toBe(100_000)
  })

  it('goes negative rather than clamping, because an overdrawn account is real', () => {
    expect(balanceFor('a', 0, [row({ kind: 'expense', amount_cents: 5_000 })])).toBe(-5_000)
  })
})
