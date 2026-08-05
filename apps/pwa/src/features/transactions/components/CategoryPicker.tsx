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
    <div className="block border-b border-hairline py-4">
      <span className="block pb-1.5 text-xs tracking-wide text-faint uppercase">Categoria</span>

      <select
        value={other ? OTHER : value}
        onChange={(e) => handleSelect(e.target.value)}
        aria-label="Categoria"
        className="w-full bg-transparent text-base text-text outline-none"
      >
        <option value="" className="bg-raised">
          Sem categoria
        </option>

        {available.map((category) => (
          <option key={category.id} value={category.id} className="bg-raised">
            {category.icon ? `${category.icon} ` : ''}
            {category.name}
          </option>
        ))}

        <option value={OTHER} className="bg-raised">
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
          className="mt-3 w-full border-b border-hairline bg-transparent pb-1 text-base text-text outline-none placeholder:text-faint focus:border-amber"
        />
      )}
    </div>
  )
}
