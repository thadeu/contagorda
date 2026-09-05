import { forwardRef } from 'react'
import { CloseIcon, SearchIcon } from '@/ui/icons'

interface SearchFieldProps {
  value: string
  open: boolean
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onCancel: () => void
}

/**
 * The platform's search field: a capsule, glass over whatever is behind it, a
 * magnifier leading and the word "Cancelar" appearing beside it once it is in
 * use. Nothing here is styled to look like the app's other inputs on purpose —
 * a search bar at the foot of a screen is a shape people already know, and
 * matching it is what makes it read as one.
 *
 * `enterKeyHint` turns the keyboard's return key into "Buscar". The search
 * itself has already happened by then; the key only dismisses the keyboard.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, open, onChange, onFocus, onBlur, onCancel },
  ref,
) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 glass rounded-full pr-3 pl-4">
        <SearchIcon className="size-5 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />

        <input
          ref={ref}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Buscar"
          aria-label="Buscar lançamentos"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()

            if (event.key === 'Escape') onCancel()
          }}
          className="search-field min-w-0 flex-1 bg-transparent text-[1.0625rem] text-ink outline-none placeholder:text-muted"
        />

        {value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpar busca"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-faint/60 text-canvas"
          >
            <CloseIcon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </label>

      {open && (
        /* Holding focus through the press: a tap elsewhere blurs the field
           first, and with nothing typed that blur would take this button away
           before its own click could land. */
        <button
          type="button"
          onClick={onCancel}
          onMouseDown={(event) => event.preventDefault()}
          className="shrink-0 px-1 text-[0.9375rem] font-medium text-ink"
        >
          Cancelar
        </button>
      )}
    </div>
  )
})
