import { describe, expect, it } from 'vitest'
import { groupByDay } from './groupByDay'
import type { Transaction } from '@/services/types'

function row(partial: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 100,
    date: '2026-09-28',
    description: '',
    paid_at: null,
    recurring_series_id: null,
    created_by_id: null,
    detached: false,
    ...partial,
  }
}

describe('groupByDay', () => {
  // Arrived largest first, which is how they were scattered on screen.
  it('keeps what belongs together side by side within a day', () => {
    const rows = [
      row({ description: 'PJ / IMPOSTO MENSAL', amount_cents: 170_000 }),
      row({ description: 'PJ / PARC IMPOSTO 21/60', amount_cents: 58_000 }),
      row({ description: 'PJ / CONTADOR', amount_cents: 45_000 }),
      row({ description: 'PJ / PARC IMPOSTO 38/60', amount_cents: 13_600 }),
    ]

    expect(groupByDay(rows)[0].transactions.map((t) => t.description)).toEqual([
      'PJ / CONTADOR',
      'PJ / IMPOSTO MENSAL',
      'PJ / PARC IMPOSTO 21/60',
      'PJ / PARC IMPOSTO 38/60',
    ])
  })

  it('reads the numbers in a name as numbers', () => {
    const rows = [row({ description: 'Parcela 10/12' }), row({ description: 'Parcela 9/12' })]

    expect(groupByDay(rows)[0].transactions.map((t) => t.description)).toEqual([
      'Parcela 9/12',
      'Parcela 10/12',
    ])
  })

  it('ignores case and accents when it compares', () => {
    const rows = [row({ description: 'banco' }), row({ description: 'Água' }), row({ description: 'Casa' })]

    expect(groupByDay(rows)[0].transactions.map((t) => t.description)).toEqual([
      'Água',
      'banco',
      'Casa',
    ])
  })

  it('puts the newest day first and sorts each day on its own', () => {
    const rows = [
      row({ date: '2026-09-09', description: 'B' }),
      row({ date: '2026-09-28', description: 'Z' }),
      row({ date: '2026-09-28', description: 'A' }),
      row({ date: '2026-09-09', description: 'A' }),
    ]

    const groups = groupByDay(rows, 'desc')

    expect(groups.map((g) => g.date)).toEqual(['2026-09-28', '2026-09-09'])
    expect(groups.map((g) => g.transactions.map((t) => t.description))).toEqual([
      ['A', 'Z'],
      ['A', 'B'],
    ])
  })

  it('leaves the list it was given alone', () => {
    const rows = [row({ description: 'B' }), row({ description: 'A' })]

    groupByDay(rows)

    expect(rows.map((t) => t.description)).toEqual(['B', 'A'])
  })
})
