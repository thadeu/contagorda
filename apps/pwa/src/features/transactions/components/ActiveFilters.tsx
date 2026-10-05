import { CloseIcon } from '@/ui/icons'

interface ActiveFiltersProps {
  recurring: boolean
  /** The name of the person the list is narrowed to, when it is. */
  person: string | null
  onClearRecurring: () => void
  onClearPerson: () => void
}

/**
 * What is narrowing the list, and the way out of each.
 *
 * A filter chosen in a sheet that has since closed leaves a list that is shorter
 * than the month for no reason on screen. These say what is on, and one tap
 * takes each off — the same reason a scope has its chip.
 */
export function ActiveFilters({
  recurring,
  person,
  onClearRecurring,
  onClearPerson,
}: ActiveFiltersProps) {
  if (!recurring && person === null) return null

  return (
    <div className="flex flex-wrap gap-2 px-3.5 pb-3">
      {recurring && <Chip label="Recorrentes" onClear={onClearRecurring} />}
      {person !== null && <Chip label={person} onClear={onClearPerson} />}
    </div>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Tirar o filtro ${label}`}
      className="flex h-8 max-w-full items-center gap-1.5 rounded-2xl bg-sunken pr-2 pl-3 text-xs font-semibold text-ink"
    >
      <span className="min-w-0 truncate">{label}</span>
      <CloseIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
