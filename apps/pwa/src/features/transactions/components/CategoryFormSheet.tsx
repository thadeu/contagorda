import { useState, type FormEvent } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon } from '../../../ui/icons'
import { useCreateCategory } from '../hooks'
import type { Direction } from '../../../services/types'

interface CategoryFormSheetProps {
  kind: Direction
  onCreated: (categoryId: string) => void
  onClose: () => void
}

const FORM_ID = 'category-form'

/**
 * A short, opinionated set rather than a full emoji keyboard.
 *
 * These are the things money goes on. An open picker offers two thousand options
 * to a question with about a dozen sensible answers, and every one of them is a
 * scroll away from the one that was wanted. Kept to a multiple of six so the
 * grid never ends on a ragged row.
 */
const ICONS = [
  '🏠', '🍽️', '🛒', '🚗', '⛽', '💊', '🏥', '📚',
  '🎓', '👕', '✈️', '🎬', '🎁', '🐶', '💡', '📱',
  '💳', '🏦', '💰', '🔧', '✂️', '☕',
  '🧾', '🚌',
]

/**
 * Creating a category, in its own sheet over the list of them.
 *
 * It used to be an "Outros" option that grew two rows inside the transaction
 * form, which meant the form held state for a category that did not exist yet
 * and had to hand it back on save. A category is its own thing: it is created,
 * then chosen. The form only ever carries an id.
 *
 * Saving selects it, because the only reason to be here is to use it — closing
 * onto a list where you still have to find what you just made would be asking
 * the same question twice.
 */
export function CategoryFormSheet({ kind, onCreated, onClose }: CategoryFormSheetProps) {
  const create = useCreateCategory()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')

  const trimmed = name.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (trimmed === '') return

    create.mutate(
      { name: trimmed, kind, icon: icon || null },
      { onSuccess: (category) => onCreated(category.id) },
    )
  }

  return (
    <BottomSheet
      title="Nova categoria"
      onClose={onClose}
      actions={
        <NavButton
          type="submit"
          form={FORM_ID}
          icon={CheckIcon}
          label="Salvar"
          disabled={create.isPending || trimmed === ''}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-4 px-3 pb-2">
        <label className="block rounded-control bg-sunken px-4 py-3">
          <span className="block pb-0.5 text-xs text-muted">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mercado, farmácia, pet…"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
        </label>

        <div>
          <p className="pb-2 text-xs text-muted">Ícone</p>

          {/* A grid, the shape every picker on the phone uses. A horizontal
              strip hides most of the set behind a scroll and fights the sheet
              for the gesture; a grid shows all of it at once and has no axis to
              argue about. */}
          <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Ícone da categoria">
            {ICONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(icon === option ? '' : option)}
                aria-pressed={icon === option}
                className={`grid aspect-square place-items-center rounded-2xl text-lg leading-none ${
                  icon === option ? 'bg-accent' : 'bg-sunken'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {create.isError && (
          <p role="alert" className="text-sm text-out">
            Não deu para criar a categoria. Tente de novo.
          </p>
        )}
      </form>
    </BottomSheet>
  )
}
