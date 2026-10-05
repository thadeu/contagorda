import { describe, expect, it } from 'vitest'
import { peopleOf } from './people'
import type { LedgerMember, Transaction } from '@/services/types'

function member(id: string, name: string): LedgerMember {
  return { id, name, email: `${id}@exemplo.com`, role: 'member', you: false }
}

function row(createdBy: string | null): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    account_id: 'a',
    category_id: null,
    kind: 'expense',
    amount_cents: 100,
    date: '2026-10-10',
    description: 'x',
    paid_at: null,
    recurring_series_id: null,
    recurrence: null,
    created_by_id: createdBy,
    detached: false,
  }
}

const members = [member('ana', 'Ana'), member('jess', 'Jéssica'), member('leo', 'Leo')]

describe('peopleOf', () => {
  it('counts what each person entered this month, most first', () => {
    const rows = [row('jess'), row('ana'), row('jess'), row('jess'), row('ana')]

    expect(peopleOf(rows, members, null).map((p) => [p.name, p.count])).toEqual([
      ['Jéssica', 3],
      ['Ana', 2],
    ])
  })

  it('carries the email, which is what tells two people apart', () => {
    expect(peopleOf([row('jess')], members, null)[0]).toMatchObject({ email: 'jess@exemplo.com' })
  })

  it('leaves out someone who entered nothing this month', () => {
    expect(peopleOf([row('ana')], members, null).map((p) => p.id)).toEqual(['ana'])
  })

  it('keeps the person already chosen, even with nothing this month', () => {
    const people = peopleOf([row('ana')], members, 'leo')

    expect(people.map((p) => [p.id, p.count])).toEqual([
      ['ana', 1],
      ['leo', 0],
    ])
  })

  it('names nobody for a row with no author or an author who left', () => {
    expect(peopleOf([row(null), row('gone')], members, null)).toEqual([])
  })

  it('breaks a tie by name', () => {
    expect(peopleOf([row('leo'), row('ana')], members, null).map((p) => p.name)).toEqual(['Ana', 'Leo'])
  })
})
