import { useState } from 'react'
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
}

const OTHER = '__other__'

/**
 * A fixed list never fits everyone's spending, and a free-text-only field turns
 * every report into a pile of near-duplicates. So: the list for the common
 * cases, "Outros" for everything else, and the typed name becomes a real
 * category — matched by name so typing the same thing twice reuses it rather
 * than splitting a total across two entries that look identical.
 */
export function CategoryPicker({
  categories,
  kind,
  value,
  onChange,
  customName,
  onCustomNameChange,
}: CategoryPickerProps) {
  const [other, setOther] = useState(customName !== '')
  const available = categories.filter((c) => c.kind === kind)

  function handleSelect(next: string) {
    if (next === OTHER) {
      setOther(true)
      onChange('')

      return
    }

    setOther(false)
    onCustomNameChange('')
    onChange(next)
  }

  return (
    <div className="card-shadow block rounded-2xl bg-surface px-4 py-3">
      <span className="block pb-0.5 text-xs text-muted">Categoria</span>

      <select
        value={other ? OTHER : value}
        onChange={(e) => handleSelect(e.target.value)}
        aria-label="Categoria"
        className="w-full bg-transparent text-base text-ink outline-none"
      >
        <option value="" className="bg-surface">
          Sem categoria
        </option>

        {available.map((category) => (
          <option key={category.id} value={category.id} className="bg-surface">
            {category.icon ? `${category.icon} ` : ''}
            {category.name}
          </option>
        ))}

        <option value={OTHER} className="bg-surface">
          Outros…
        </option>
      </select>

      {other && (
        <input
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          placeholder="Nome da categoria"
          aria-label="Nome da nova categoria"
          autoFocus
          className="mt-2 w-full rounded-xl bg-sunken px-3 py-2 text-base text-ink outline-none placeholder:text-faint"
        />
      )}
    </div>
  )
}
