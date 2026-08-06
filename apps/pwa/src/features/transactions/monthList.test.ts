import { describe, it, expect } from 'vitest'
import { groupByDay, peakNet } from './groupByDay'
import { LIST_ORDER, matchesStatus } from './useStatusFilter'
import type { Transaction } from '../../services/types'

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    account_id: 'acc',
    category_id: null,
    kind: 'expense',
    amount_cents: 1000,
    date: '2026-08-10',
    description: 'Conta',
    paid_at: null,
    recurring_series_id: null,
    ...overrides,
  }
}

describe('status filter', () => {
  it('treats a transaction with no paid_at as pending', () => {
    expect(matchesStatus(tx({ paid_at: null }), 'pending')).toBe(true)
    expect(matchesStatus(tx({ paid_at: null }), 'paid')).toBe(false)
  })

  it('treats a transaction with paid_at as paid', () => {
    const paid = tx({ paid_at: '2026-08-10T12:00:00Z' })

    expect(matchesStatus(paid, 'paid')).toBe(true)
    expect(matchesStatus(paid, 'pending')).toBe(false)
  })

  // Both lists open at the end of the month, because what is being checked is
  // usually what just happened.
  it('orders every list newest first', () => {
    expect(LIST_ORDER).toBe('desc')
  })
})

describe('groupByDay', () => {
  it('puts the oldest day first when ascending', () => {
    const groups = groupByDay(
      [tx({ date: '2026-08-20' }), tx({ date: '2026-08-05' }), tx({ date: '2026-08-12' })],
      'asc',
    )

    expect(groups.map((g) => g.date)).toEqual(['2026-08-05', '2026-08-12', '2026-08-20'])
  })

  it('puts the newest day first when descending', () => {
    const groups = groupByDay(
      [tx({ date: '2026-08-05' }), tx({ date: '2026-08-20' })],
      'desc',
    )

    expect(groups.map((g) => g.date)).toEqual(['2026-08-20', '2026-08-05'])
  })

  it('collects every transaction of a day into one group', () => {
    const groups = groupByDay([tx({ date: '2026-08-05' }), tx({ date: '2026-08-05' })])

    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
  })

  // The net drives the spine, so income has to lift it and expense has to
  // lower it — a sum of raw amounts would draw every day as an outflow.
  it('nets income against expense within a day', () => {
    const groups = groupByDay([
      tx({ date: '2026-08-05', kind: 'income', amount_cents: 5000 }),
      tx({ date: '2026-08-05', kind: 'expense', amount_cents: 2000 }),
    ])

    expect(groups[0].netCents).toBe(3000)
  })

  it('reports the largest absolute net as the peak', () => {
    const groups = groupByDay([
      tx({ date: '2026-08-05', amount_cents: 2000 }),
      tx({ date: '2026-08-06', kind: 'income', amount_cents: 9000 }),
    ])

    expect(peakNet(groups)).toBe(9000)
  })

  it('returns nothing for an empty month', () => {
    expect(groupByDay([])).toEqual([])
    expect(peakNet([])).toBe(0)
  })
})
