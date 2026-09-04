import { CloseIcon } from '@/ui/icons'

interface ScopeChipProps {
  label: string
  onClear: () => void
}

/**
 * The scope the list is under, and the way out of it.
 *
 * It stands where the status pill stands, at the same height, because it is
 * the same slot: while a scope is on, status is not a question. One tap
 * clears it — the card that turned it on is off screen once the list has
 * been scrolled, and a filter with no visible way out is a list that looks
 * short for no reason.
 */
export function ScopeChip({ label, onClear }: ScopeChipProps) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Mostrar tudo, sair do filtro ${label}`}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-in pr-2.5 pl-3.5 text-sm font-semibold text-white"
    >
      {label}
      <CloseIcon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
