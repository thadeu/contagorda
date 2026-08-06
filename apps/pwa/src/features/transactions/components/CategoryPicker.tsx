import { useState } from 'react'
import { OptionSheet } from '../../../ui/OptionSheet'
import { ChevronRightIcon } from '../../../ui/icons'
import type { Category, Direction } from '../../../services/types'

interface CategoryPickerProps {
  categories: Category[]
  kind: Direction
  /** The chosen category id, or '' for none. */
  value: string
  onChange: (categoryId: string) => void
  /** Free text typed under "Outros"; empty when a listed category is chosen. */
  customName: string
  onCustomNameChange: (name: string) => void
  customIcon: string
  onCustomIconChange: (icon: string) => void
}

/**
 * A short, opinionated set rather than a full emoji keyboard.
 *
 * These are the things money goes on. An open picker offers two thousand
 * options to answer a question with about a dozen sensible answers, and every
 * one of them is a scroll away from the one you wanted. The system keyboard is
 * still there for anyone who wants a llama.
 */
const ICONS = [
  '🏠', '🍽️', '🛒', '🚗', '⛽', '💊', '🏥', '📚',
  '🎓', '👕', '✈️', '🎬', '🎁', '🐶', '💡', '📱',
  '💳', '🏦', '💰', '🔧', '✂️', '☕',
]

const NONE = ''
const OTHER = '__other__'

/**
 * A fixed list never fits everyone's spending, and a free-text-only field turns
 * every report into a pile of near-duplicates. So: the list for the common
 * cases, "Outros" for everything else, and the typed name becomes a real
 * category — matched by name, so typing the same thing twice reuses it rather
 * than splitting a total across two entries that look identical.
 *
 * The row shows the answer and opens a sheet. The name of a category is the
 * point — it is what you will read in a report a year from now — and a row that
 * displays it means the common case needs no taps at all.
 */
export function CategoryPicker({
  categories,
  kind,
  value,
  onChange,
  customName,
  onCustomNameChange,
  customIcon,
  onCustomIconChange,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [other, setOther] = useState(customName !== '')
  const available = categories.filter((c) => c.kind === kind)

  const options = [
    { value: NONE, label: 'Sem categoria' },
    ...available.map((category) => ({ value: category.id, label: category.name })),
    { value: OTHER, label: 'Outros…' },
  ]

  function handleSelect(next: string) {
    if (next === OTHER) {
      setOther(true)
      onChange('')

      return
    }

    setOther(false)
    onCustomNameChange('')
    onCustomIconChange('')
    onChange(next)
  }

  const picked = available.find((c) => c.id === value)
  const chosen = other
    ? `${customIcon} ${customName.trim() || 'Outros'}`.trim()
    : [picked?.icon, picked?.name ?? 'Sem categoria'].filter(Boolean).join(' ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center gap-3 text-left"
      >
        <span className="w-24 shrink-0 text-sm text-muted">Categoria</span>

        <span className="min-w-0 flex-1 truncate text-right text-base text-ink">{chosen}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-faint" />
      </button>

      {other && (
        <>
          <label className="flex min-h-13 items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-muted">Nome</span>
            <input
              value={customName}
              onChange={(event) => onCustomNameChange(event.target.value)}
              placeholder="Nome da categoria"
              aria-label="Nome da nova categoria"
              className="w-full min-w-0 flex-1 bg-transparent text-right text-base text-ink outline-none placeholder:text-faint"
            />
          </label>

          <div className="py-3">
            <p className="pb-2 text-sm text-muted">Ícone</p>

            <div className="-mx-4 overflow-x-auto px-4">
              <div className="flex w-max gap-1.5" role="group" aria-label="Ícone da categoria">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => onCustomIconChange(customIcon === icon ? '' : icon)}
                    aria-pressed={customIcon === icon}
                    className={`grid size-10 shrink-0 place-items-center rounded-2xl text-lg ${
                      customIcon === icon ? 'bg-accent' : 'bg-sunken'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {open && (
        <OptionSheet
          title="Categoria"
          options={options}
          value={other ? OTHER : value}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
