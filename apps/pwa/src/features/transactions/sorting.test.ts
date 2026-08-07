import { describe, expect, it } from 'vitest'
import { groupsByDay, sortRows } from './sorting'
import type { Category, Transaction } from '../../services/types'

function row(partial: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 0,
    date: '2026-08-10',
    description: '',
    paid_at: null,
    recurring_series_id: null,
    created_by_id: null,
    detached: false,
    ...partial,
  }
}

function category(id: string, name: string): [string, Category] {
  return [id, { id, name, kind: 'expense', icon: null, color: null }]
}

const categories = new Map([category('c1', 'Moradia'), category('c2', 'Alimentação')])

describe('sortRows', () => {
  it('puts the largest amount first, because that is why anyone sorts by value', () => {
    const rows = [row({ amount_cents: 100 }), row({ amount_cents: 900 }), row({ amount_cents: 500 })]

    expect(sortRows(rows, 'amount', categories).map((r) => r.amount_cents)).toEqual([900, 500, 100])
  })

  it('sorts names the way a person reads them, ignoring case and accents', () => {
    const rows = [row({ description: 'banco' }), row({ description: 'Água' }), row({ description: 'Casa' })]

    expect(sortRows(rows, 'description', categories).map((r) => r.description)).toEqual([
      'Água',
      'banco',
      'Casa',
    ])
  })

  it('sorts by category name, with uncategorised last', () => {
    const rows = [
      row({ category_id: null, description: 'sem' }),
      row({ category_id: 'c1', description: 'moradia' }),
      row({ category_id: 'c2', description: 'comida' }),
    ]

    expect(sortRows(rows, 'category', categories).map((r) => r.description)).toEqual([
      'comida',
      'moradia',
      'sem',
    ])
  })

  it('sorts by date newest first', () => {
    const rows = [row({ date: '2026-08-01' }), row({ date: '2026-08-28' }), row({ date: '2026-08-15' })]

    expect(sortRows(rows, 'date', categories).map((r) => r.date)).toEqual([
      '2026-08-28',
      '2026-08-15',
      '2026-08-01',
    ])
  })

  it('leaves the original list alone', () => {
    const rows = [row({ amount_cents: 100 }), row({ amount_cents: 900 })]

    sortRows(rows, 'amount', categories)

    expect(rows.map((r) => r.amount_cents)).toEqual([100, 900])
  })
})

describe('groupsByDay', () => {
  /**
   * A day heading claims everything under it happened that day. Any other order
   * breaks that claim, so the list has to go flat rather than print headings
   * that repeat or lie.
   */
  it('only groups when the order is chronological', () => {
    expect(groupsByDay('date')).toBe(true)
    expect(groupsByDay('amount')).toBe(false)
    expect(groupsByDay('description')).toBe(false)
    expect(groupsByDay('category')).toBe(false)
  })
})
