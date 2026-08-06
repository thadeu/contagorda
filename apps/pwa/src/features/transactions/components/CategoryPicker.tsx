import { useState } from 'react'
import { ChevronRightIcon } from '../../../ui/icons'
import { CategorySheet } from './CategorySheet'
import type { Category, Direction } from '../../../services/types'

interface CategoryPickerProps {
  categories: Category[]
  kind: Direction
  /** The chosen category id, or '' for none. */
  value: string
  onChange: (categoryId: string) => void
}

/**
 * The row shows the answer and opens the list.
 *
 * The name of a category is the point — it is what will be read in a report a
 * year from now — so the row displays it, and not changing it, which is the
 * common case, costs nothing.
 *
 * Creating one is no longer this component's business. It used to hold an
 * "Outros" mode with a name and an icon of its own, which meant the transaction
 * form carried state for a category that did not exist yet and had to hand it
 * back on save. A category is created, then chosen; the form only ever sees an
 * id.
 */
export function CategoryPicker({ categories, kind, value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const picked = categories.find((category) => category.id === value)

  const label = picked ? [picked.icon, picked.name].filter(Boolean).join(' ') : 'Sem categoria'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center gap-3 text-left"
      >
        <span className="w-24 shrink-0 text-sm text-muted">Categoria</span>

        <span className="min-w-0 flex-1 truncate text-right text-base text-ink">{label}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-faint" />
      </button>

      {open && (
        <CategorySheet
          categories={categories}
          kind={kind}
          value={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
