import { fold } from '@/lib/text'
import type { Direction, Transaction } from '@/services/types'

export interface NameSuggestion {
  description: string
  categoryId: string | null
  accountId: string
  /** How many rows carried this name. Orders the list. */
  uses: number
}

/** More than this and the chips wrap into a second row that hides the form. */
const LIMIT = 4

/**
 * Names already used, matching what is being typed.
 *
 * Most new rows are old rows again — the market, the pharmacy, the rent — so
 * the names the ledger already holds are a better keyboard than the keyboard.
 * Folded on both sides, the way search and categories match, and by prefix of
 * any word: "far" finds "Farmácia" and "sao" finds "Farmácia São João".
 *
 * One entry per name, keyed on the fold so "Mercado" and "mercado" are one
 * chip, spelled the way it was spelled last. The category and the account are
 * the most recent ones used with that name, because the last time is the best
 * guess for this time.
 *
 * Kept to the same direction: an income called "Salário" is no help while
 * entering an expense.
 */
export function suggestNames(rows: Transaction[], query: string, kind: Direction): NameSuggestion[] {
  const term = fold(query).trim()

  if (term === '') return []

  const byName = new Map<string, NameSuggestion & { latest: string }>()

  for (const row of rows) {
    if (row.kind !== kind) continue

    const key = fold(row.description).trim()

    if (key === term || !matches(key, term)) continue

    const seen = byName.get(key)

    if (!seen) {
      byName.set(key, {
        description: row.description.trim(),
        categoryId: row.category_id,
        accountId: row.account_id,
        uses: 1,
        latest: row.date,
      })

      continue
    }

    seen.uses += 1

    if (row.date > seen.latest) {
      seen.latest = row.date
      seen.description = row.description.trim()
      seen.categoryId = row.category_id
      seen.accountId = row.account_id
    }
  }

  return [...byName.values()]
    .sort((a, b) => b.uses - a.uses || b.latest.localeCompare(a.latest))
    .slice(0, LIMIT)
    .map(({ description, categoryId, accountId, uses }) => ({ description, categoryId, accountId, uses }))
}

function matches(name: string, term: string): boolean {
  return name.startsWith(term) || name.includes(` ${term}`)
}
