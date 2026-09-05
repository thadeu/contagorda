import { describe, expect, it } from 'vitest'
import { suggestNames } from './suggestions'
import type { Transaction } from '@/services/types'

function row(over: Partial<Transaction>): Transaction {
  return {
    id: over.id ?? Math.random().toString(36),
    account_id: 'acc-1',
    category_id: 'cat-1',
    kind: 'expense',
    amount_cents: 100,
    date: '2026-08-01',
    description: 'Mercado',
    paid_at: null,
    recurring_series_id: null,
    created_by_id: null,
    detached: false,
    ...over,
  }
}

describe('suggestNames', () => {
  it('matches the start of any word, accents aside', () => {
    const rows = [row({ description: 'Farmácia São João' }), row({ description: 'Mercado' })]

    expect(suggestNames(rows, 'sao', 'expense').map((s) => s.description)).toEqual(['Farmácia São João'])
    expect(suggestNames(rows, 'FAR', 'expense')).toHaveLength(1)
    expect(suggestNames(rows, 'cado', 'expense')).toHaveLength(0)
  })

  it('folds duplicates into one chip and orders by how often the name was used', () => {
    const rows = [
      row({ description: 'Uber', date: '2026-07-01' }),
      row({ description: 'uber', date: '2026-08-01', category_id: 'cat-2', account_id: 'acc-2' }),
      row({ description: 'Unimed' }),
    ]

    const [first, second] = suggestNames(rows, 'u', 'expense')

    expect(first).toEqual({ description: 'uber', categoryId: 'cat-2', accountId: 'acc-2', uses: 2 })
    expect(second.description).toBe('Unimed')
  })

  it('keeps to the direction being entered and hides an exact match', () => {
    const rows = [row({ description: 'Salário', kind: 'income' }), row({ description: 'Mercado' })]

    expect(suggestNames(rows, 'sal', 'expense')).toHaveLength(0)
    expect(suggestNames(rows, 'sal', 'income')).toHaveLength(1)
    expect(suggestNames(rows, 'mercado', 'expense')).toHaveLength(0)
  })

  it('answers nothing for a blank query', () => {
    expect(suggestNames([row({})], '  ', 'expense')).toEqual([])
  })
})
