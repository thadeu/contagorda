import { useState } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon, PlusIcon } from '../../../ui/icons'
import { CategoryFormSheet } from './CategoryFormSheet'
import type { Category, Direction } from '../../../services/types'

interface CategorySheetProps {
  categories: Category[]
  kind: Direction
  value: string
  onSelect: (categoryId: string) => void
  onClose: () => void
}

/**
 * The list of categories, with the way to add one in its header.
 *
 * Same shape as accounts: a sheet that lists, and a plus that opens the form
 * over it. It replaces an "Outros…" row that turned the picker into a mode —
 * choosing it changed what the form underneath was showing, which is a lot of
 * consequence for an item in a list.
 */
export function CategorySheet({ categories, kind, value, onSelect, onClose }: CategorySheetProps) {
  const [creating, setCreating] = useState(false)
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
            onClick={() => setCreating(true)}
          />
        }
      >
        <ul className="px-1">
          <li>
            <Row label="Sem categoria" chosen={value === ''} onClick={() => choose('')} />
          </li>

          {available.map((category) => (
            <li key={category.id}>
              <Row
                label={[category.icon, category.name].filter(Boolean).join(' ')}
                chosen={category.id === value}
                onClick={() => choose(category.id)}
              />
            </li>
          ))}
        </ul>
      </BottomSheet>

      {creating && (
        <CategoryFormSheet
          kind={kind}
          onCreated={(categoryId) => {
            setCreating(false)
            choose(categoryId)
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  )
}

function Row({
  label,
  chosen,
  onClick,
}: {
  label: string
  chosen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chosen}
      className="flex min-h-13 w-full items-center justify-between gap-3 rounded-control px-3 text-left"
    >
      <span className="min-w-0 truncate text-[0.9375rem] text-ink">{label}</span>

      {chosen && <CheckIcon className="size-4 shrink-0 text-accent" />}
    </button>
  )
}
