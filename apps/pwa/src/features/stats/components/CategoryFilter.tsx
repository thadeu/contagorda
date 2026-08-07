import type { Category, Transaction } from '@/services/types'

export const ALL = null

/** Rows with no category still belong somewhere, so they get a chip of their own. */
export const UNCATEGORISED = 'none'

interface CategoryFilterProps {
  rows: Transaction[]
  categories: Map<string, Category>
  selected: string | null
  onSelect: (categoryId: string | null) => void
}

/**
 * The categories this month actually has, in the order they cost.
 *
 * Only what appears in the month is offered. A filter listing every category
 * ever created would mostly be chips that empty the screen, and the month with
 * three kinds of spending would look like a month with twenty.
 *
 * Names only. An icon beside a word makes the row taller and the word smaller,
 * and the word is what is being read — these are labels, not destinations.
 *
 * They carry the same corner as the nav buttons rather than a pill's. A row of
 * pills beside a squircle back button reads as two sets of controls that arrived
 * from different screens.
 *
 * Biggest first, because the reason to open this is usually the largest number,
 * and it puts the answer under the thumb rather than at the end of a scroll.
 */
export function CategoryFilter({ rows, categories, selected, onSelect }: CategoryFilterProps) {
  const present = byWeight(rows)

  if (present.length < 2) {
    return null
  }

  return (
    <div className="touch-pan-x overflow-x-auto px-4 pb-3">
      <div className="flex w-max gap-2" role="group" aria-label="Filtrar por categoria">
        <Chip active={selected === ALL} onClick={() => onSelect(ALL)}>
          Tudo
        </Chip>

        {present.map((id) => (
          <Chip key={id} active={selected === id} onClick={() => onSelect(id)}>
            {id === UNCATEGORISED ? 'Sem categoria' : (categories.get(id)?.name ?? 'Sem categoria')}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 shrink-0 rounded-2xl px-4 text-sm font-medium whitespace-nowrap ${
        active ? 'bg-fill text-on-fill' : 'bg-sunken text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/** Category ids present in these rows, heaviest first. */
function byWeight(rows: Transaction[]): string[] {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const key = row.category_id ?? UNCATEGORISED

    totals.set(key, (totals.get(key) ?? 0) + row.amount_cents)
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}
