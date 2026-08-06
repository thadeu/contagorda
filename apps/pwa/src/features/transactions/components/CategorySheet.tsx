import { useState } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon, EditIcon, PlusIcon } from '../../../ui/icons'
import { CategoryFormSheet } from './CategoryFormSheet'
import type { Category, Direction } from '../../../services/types'

interface CategorySheetProps {
  categories: Category[]
  kind: Direction
  value: string
  onSelect: (categoryId: string) => void
  onClose: () => void
}

type Editing = { mode: 'new' } | { mode: 'edit'; category: Category } | null

/**
 * The list of categories, with the ways to change it.
 *
 * Same shape as accounts: a sheet that lists, and a plus that opens a form over
 * it. The row picks; the pencil beside it edits. Two targets in one row work
 * here because they read as different things — a name to choose and a control to
 * change it — and the alternative is a mode, where tapping means one thing until
 * you press a button somewhere that makes it mean another.
 *
 * "Sem categoria" has no pencil. It is not a category, it is the absence of one.
 */
export function CategorySheet({ categories, kind, value, onSelect, onClose }: CategorySheetProps) {
  const [editing, setEditing] = useState<Editing>(null)
  const available = categories.filter((category) => category.kind === kind)

  function choose(categoryId: string) {
    onSelect(categoryId)
    onClose()
  }

  return (
    <>
      <BottomSheet
        title="Categoria"
        onClose={onClose}
        expandable
        actions={
          <NavButton
            primary
            icon={PlusIcon}
            label="Nova categoria"
            onClick={() => setEditing({ mode: 'new' })}
          />
        }
      >
        <ul className="px-1">
          <li>
            <button
              type="button"
              onClick={() => choose('')}
              aria-pressed={value === ''}
              className="flex min-h-13 w-full items-center justify-between gap-3 rounded-control px-3 text-left"
            >
              <span className="min-w-0 truncate text-[0.9375rem] text-ink">Sem categoria</span>

              {value === '' && <CheckIcon className="size-4 shrink-0 text-accent" />}
            </button>
          </li>

          {available.map((category) => (
            <li key={category.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => choose(category.id)}
                aria-pressed={category.id === value}
                className="flex min-h-13 min-w-0 flex-1 items-center justify-between gap-3 rounded-control px-3 text-left"
              >
                <span className="min-w-0 truncate text-[0.9375rem] text-ink">
                  {[category.icon, category.name].filter(Boolean).join(' ')}
                </span>

                {category.id === value && <CheckIcon className="size-4 shrink-0 text-accent" />}
              </button>

              <button
                type="button"
                onClick={() => setEditing({ mode: 'edit', category })}
                aria-label={`Editar ${category.name}`}
                className="grid size-10 shrink-0 place-items-center rounded-2xl text-muted"
              >
                <EditIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      {editing && (
        <CategoryFormSheet
          kind={kind}
          category={editing.mode === 'edit' ? editing.category : undefined}
          onSaved={(categoryId) => {
            setEditing(null)
            choose(categoryId)
          }}
          onDeleted={() => setEditing(null)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
