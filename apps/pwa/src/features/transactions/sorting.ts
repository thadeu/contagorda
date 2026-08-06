import type { Category, Transaction } from '../../services/types'

export type Sort = 'date' | 'description' | 'amount' | 'category'

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'date', label: 'Data' },
  { value: 'description', label: 'Nome' },
  { value: 'amount', label: 'Valor' },
  { value: 'category', label: 'Categoria' },
]

export function isSort(value: string | null): value is Sort {
  return SORTS.some((sort) => sort.value === value)
}

/**
 * Only sorting by date can be grouped by day.
 *
 * Day headings are a claim that everything under them happened on that day. Sort
 * by value and the list is no longer chronological, so the headings would either
 * repeat down the page or lie — the list goes flat instead, which is the honest
 * shape for an order that has nothing to do with time.
 */
export function groupsByDay(sort: Sort): boolean {
  return sort === 'date'
}

/**
 * Text sorts read the way a person reads: case-insensitive, accents folded, so
 * "Água" lands with the As rather than after Z. Amount sorts largest first,
 * because the reason to sort by value is to find what the month was spent on.
 */
export function sortRows(
  rows: Transaction[],
  sort: Sort,
  categories: Map<string, Category>,
): Transaction[] {
  const sorted = [...rows]

  if (sort === 'amount') {
    return sorted.sort((a, b) => b.amount_cents - a.amount_cents)
  }

  if (sort === 'description') {
    return sorted.sort((a, b) => compare(a.description, b.description))
  }

  if (sort === 'category') {
    return sorted.sort((a, b) => compare(nameOf(a, categories), nameOf(b, categories)))
  }

  return sorted.sort((a, b) => b.date.localeCompare(a.date))
}

/** Rows with no category sort last, where an empty label would sort first. */
function nameOf(row: Transaction, categories: Map<string, Category>): string {
  const name = row.category_id ? categories.get(row.category_id)?.name : undefined

  return name ?? '￿'
}

function compare(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
}
