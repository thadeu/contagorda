import { useState, type FormEvent } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { ConfirmSheet } from '../../../ui/ConfirmSheet'
import { Button } from '../../../ui/Button'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon, SearchIcon } from '../../../ui/icons'
import { searchIcons } from '../categoryIcons'
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks'
import type { Category, Direction } from '../../../services/types'

interface CategoryFormSheetProps {
  kind: Direction
  /** Present when editing one that exists; absent when making a new one. */
  category?: Category
  onSaved: (categoryId: string) => void
  onDeleted: () => void
  onClose: () => void
}

const FORM_ID = 'category-form'

/**
 * Creating and editing a category, in its own sheet over the list of them.
 *
 * One sheet for both, because the fields are the same and a reduced edit screen
 * drifts from the create screen the first time either changes. Editing is not a
 * rare path: a category is usually named in a hurry, in the middle of entering
 * something else, and read a year later.
 *
 * Saving selects it, because the only reason to be here is to use it — closing
 * onto a list where you still have to find what you just made would be asking
 * the same question twice.
 */
export function CategoryFormSheet({
  kind,
  category,
  onSaved,
  onDeleted,
  onClose,
}: CategoryFormSheetProps) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? '')
  const [query, setQuery] = useState('')
  const [deleting, setDeleting] = useState(false)

  const found = searchIcons(query)
  const trimmed = name.trim()
  const pending = create.isPending || update.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    /*
     * React events travel the component tree, not the DOM one, and a portal does
     * not break that — this sheet is written inside the transaction form, so its
     * submit reaches that form's handler and saves it too. Every form rendered
     * inside another one's tree has to stop here, whatever the DOM says about
     * where it actually is.
     */
    event.stopPropagation()

    if (trimmed === '') return

    if (category) {
      update.mutate(
        { id: category.id, name: trimmed, icon: icon || null },
        { onSuccess: () => onSaved(category.id) },
      )

      return
    }

    create.mutate(
      { name: trimmed, kind, icon: icon || null },
      { onSuccess: (created) => onSaved(created.id) },
    )
  }

  return (
    <>
      <BottomSheet
        title={category ? 'Editar categoria' : 'Nova categoria'}
        onClose={onClose}
        actions={
          <NavButton
            type="submit"
            form={FORM_ID}
            icon={CheckIcon}
            label="Salvar"
            disabled={pending || trimmed === ''}
          />
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-4 px-3 pb-2">
          {/* The chosen icon sits where it will be read: beside the name, at the
              size a list row shows it. Picking one from a grid of a hundred and
              eighty tells you what you tapped; only here does it tell you what the
              category will look like. Empty until then — a placeholder glyph would
              be a choice nobody made. */}
          <div className="flex items-stretch gap-2">
            <span
              aria-hidden="true"
              className="flex w-14 shrink-0 items-center justify-center rounded-control bg-sunken"
            >
              <span className="block text-xl leading-none">{icon}</span>
            </span>

            <label className="min-w-0 flex-1 rounded-control bg-sunken px-4 py-3">
              <span className="block pb-0.5 text-xs text-muted">Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mercado, farmácia, pet…"
                className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
              />
            </label>
          </div>

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
              <div
                className="grid grid-cols-6 gap-1.5"
                role="group"
                aria-label="Ícone da categoria"
              >
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

          {(create.isError || update.isError) && (
            <p role="alert" className="text-sm text-out">
              Não deu para salvar a categoria. Tente de novo.
            </p>
          )}

          {/* Below saving, never above it: a destructive action sitting where the
              thumb lands after the last field is a mis-tap waiting to happen. */}
          {category && (
            <div className="mt-2 rounded-card bg-surface p-4">
              <p className="text-xs leading-relaxed text-muted">
                Excluir remove a categoria das listas. Os lançamentos que estavam nela continuam,
                sem categoria.
              </p>

              <Button
                type="button"
                variant="danger"
                className="mt-3 w-full"
                disabled={remove.isPending}
                onClick={() => setDeleting(true)}
              >
                Excluir categoria
              </Button>
            </div>
          )}
        </form>
      </BottomSheet>

      {deleting && category && (
        <ConfirmSheet
          danger
          title={`Excluir ${category.name}?`}
          message="Os lançamentos que estavam nela continuam no histórico, sem categoria. O valor e a data não mudam."
          confirmLabel="Excluir"
          pending={remove.isPending}
          onClose={() => setDeleting(false)}
          onConfirm={() => remove.mutate(category.id, { onSuccess: onDeleted })}
        />
      )}
    </>
  )
}
