import type { LedgerMember, Transaction } from '@/services/types'

export interface Person {
  id: string
  name: string
  email: string
  /** How many rows of the month they entered. */
  count: number
}

/**
 * Who entered the rows of this month, most first.
 *
 * Built from the rows and not from the members: a ledger has people who entered
 * nothing this month, and a filter that offered them would lead to an empty list.
 * The person already chosen stays even when the month holds none of theirs, so
 * the choice can be seen and taken back instead of silently leaving an empty
 * list with nothing to explain it.
 *
 * A row with no author, or one whose author has left the ledger, is nobody's:
 * there is no name to offer and inventing one would state what is not known.
 */
export function peopleOf(rows: Transaction[], members: LedgerMember[], chosen: string | null): Person[] {
  const counts = new Map<string, number>()

  for (const row of rows) {
    if (row.created_by_id) counts.set(row.created_by_id, (counts.get(row.created_by_id) ?? 0) + 1)
  }

  return members
    .filter((member) => counts.has(member.id) || member.id === chosen)
    .map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      count: counts.get(member.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
}
