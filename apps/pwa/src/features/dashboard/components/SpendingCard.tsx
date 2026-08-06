import { useLocation, useNavigate } from 'react-router'
import { ChevronRightIcon } from '../../../ui/icons'
import { Money } from '../../../ui/Money'
import { monthLabel } from '../../../lib/dates'
import { useCategories } from '../../accounts/hooks'
import { useTransactions } from '../../transactions/hooks'
import type { Transaction } from '../../../services/types'

/**
 * A palette for the bar, not for the categories.
 *
 * Colours are assigned by size order, so the largest slice is always the same
 * colour — the bar is read as proportion, and a category keeping its own hue
 * would be a second thing to learn for no gain. The day categories carry a
 * colour of their own, this defers to it.
 */
const SLICES = ['bg-[#f5b544]', 'bg-[#8b5cf6]', 'bg-[#38bdf8]', 'bg-[#f0475f]', 'bg-[#22c39a]']

/**
 * Where the month went, in one bar, and the way into the history behind it.
 *
 * The chevron is the only thing saying so. A card that opens a screen and looks
 * exactly like the card beside it — which does not — is a control nobody finds,
 * and the whole statistics view was reachable only by guessing.
 *
 * The proportions are the point, not the figures — which category took the most
 * is legible in a glance and would take a table to say otherwise. Anything past
 * the top few is folded into one slice, because a bar with eleven segments
 * measures nothing.
 */
export function SpendingCard({ month }: { month: string }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const transactions = useTransactions(month)
  const categories = useCategories()

  const rows = (transactions.data ?? []).filter((t) => t.kind === 'expense')
  const totalCents = rows.reduce((total, row) => total + row.amount_cents, 0)
  const slices = topSlices(rows, totalCents)

  const names = new Map((categories.data ?? []).map((category) => [category.id, category.name]))

  return (
    <button
      type="button"
      onClick={() => navigate({ pathname: '/stats', search })}
      className="h-full w-full rounded-card bg-surface px-4 py-3.5 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
          Despesas
        </p>

        <ChevronRightIcon className="size-4 shrink-0 text-faint" aria-hidden="true" />
      </div>

      <p className="truncate pt-0.5 text-xs text-muted first-letter:uppercase">
        {monthLabel(month)}
      </p>

      <Money cents={totalCents} className="block pt-1 text-xl font-bold text-ink" />

      <div className="flex h-1.5 gap-0.5 overflow-hidden pt-3" aria-hidden="true">
        {slices.map((slice, index) => (
          <span
            key={slice.key}
            style={{ width: `${slice.share * 100}%` }}
            className={`h-1.5 rounded-full ${SLICES[index % SLICES.length]}`}
          />
        ))}
      </div>

      {slices.length > 0 && (
        <p className="truncate pt-2 text-xs text-muted">
          Maior: {names.get(slices[0].key) ?? 'Sem categoria'}
        </p>
      )}
    </button>
  )
}

interface Slice {
  key: string
  share: number
}

/** The four biggest categories, with everything else as one remainder. */
function topSlices(rows: Transaction[], totalCents: number): Slice[] {
  if (totalCents === 0) return []

  const byCategory = new Map<string, number>()

  for (const row of rows) {
    const key = row.category_id ?? 'none'

    byCategory.set(key, (byCategory.get(key) ?? 0) + row.amount_cents)
  }

  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 4)
  const rest = sorted.slice(4).reduce((total, [, cents]) => total + cents, 0)

  const slices = top.map(([key, cents]) => ({ key, share: cents / totalCents }))

  return rest === 0 ? slices : [...slices, { key: 'rest', share: rest / totalCents }]
}
