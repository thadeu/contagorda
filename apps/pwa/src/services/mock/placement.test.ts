import { describe, expect, it } from 'vitest'
import { withPlacement } from './placement'
import type { Transaction } from '@/services/types'

const rule = { frequency: 'monthly', interval: 1, ends_on: '2026-12-10', position: 1, total: 1 } as const

function row(id: string, date: string, series: string | null): Transaction {
  return {
    id,
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 100,
    date,
    description: 'x',
    paid_at: null,
    recurring_series_id: series,
    recurrence: series ? rule : null,
    created_by_id: null,
    detached: false,
  }
}

describe('withPlacement', () => {
  const all = [
    row('c', '2026-10-10', 's'),
    row('a', '2026-08-10', 's'),
    row('b', '2026-09-10', 's'),
    row('z', '2026-09-10', null),
  ]

  it('numbers a series in date order, whatever order it is given', () => {
    const placed = withPlacement(all)

    expect(placed.filter((r) => r.recurrence).map((r) => [r.id, r.recurrence!.position])).toEqual([
      ['c', 3],
      ['a', 1],
      ['b', 2],
    ])
    expect(placed.every((r) => r.recurrence === null || r.recurrence.total === 3)).toBe(true)
  })

  it('counts from the whole series, not from the part being answered', () => {
    const [october] = withPlacement(all, [all[0]])

    expect(october.recurrence).toMatchObject({ position: 3, total: 3 })
  })

  it('leaves a row with no series alone', () => {
    expect(withPlacement(all, [all[3]])[0]).toBe(all[3])
  })

  it('renumbers when a row goes', () => {
    const [october] = withPlacement(all.filter((r) => r.id !== 'a'), [all[0]])

    expect(october.recurrence).toMatchObject({ position: 2, total: 2 })
  })
})
