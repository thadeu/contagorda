import { useState, type FormEvent } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon, SearchIcon } from '../../../ui/icons'
import { searchIcons } from '../categoryIcons'
import { useCreateCategory } from '../hooks'
import type { Direction } from '../../../services/types'

interface CategoryFormSheetProps {
  kind: Direction
  onCreated: (categoryId: string) => void
  onClose: () => void
}

const FORM_ID = 'category-form'

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
  const [query, setQuery] = useState('')

  const found = searchIcons(query)

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

          <label className="mb-2 flex items-center gap-2 rounded-control bg-sunken px-3 py-2">
            <SearchIcon className="size-4 shrink-0 text-faint" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome"
              aria-label="Buscar ícone"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
          </label>

          {/* A grid, the shape every picker on the phone uses. A horizontal strip
              hides most of the set behind a scroll and fights the sheet for the
              gesture; a grid has no axis to argue about, and with search above it
              the length stops mattering. */}
          {found.length === 0 ? (
            <p className="py-4 text-sm text-muted">Nenhum ícone com esse nome.</p>
          ) : (
            <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Ícone da categoria">
              {found.map((option) => (
                <button
                  key={option.emoji}
                  type="button"
                  onClick={() => setIcon(icon === option.emoji ? '' : option.emoji)}
                  aria-pressed={icon === option.emoji}
                  aria-label={option.terms.split(' ')[0]}
                  className={`flex aspect-square items-center justify-center rounded-2xl ${
                    icon === option.emoji ? 'bg-accent' : 'bg-sunken'
                  }`}
                >
                  <span className="block text-lg leading-none">{option.emoji}</span>
                </button>
              ))}
            </div>
          )}
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
