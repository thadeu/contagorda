import { BottomSheet } from '../../../ui/BottomSheet'
import { CheckIcon } from '../../../ui/icons'
import { SORTS, type Sort } from '../sorting'
import type { Status } from '../useStatusFilter'

interface FilterSheetProps {
  status: Status
  sort: Sort
  onStatusChange: (status: Status) => void
  onSortChange: (sort: Sort) => void
  onClose: () => void
}

const STATUSES: { value: Status; label: string }[] = [
  { value: 'pending', label: 'A pagar' },
  { value: 'paid', label: 'Pago' },
]

/**
 * Both questions about the list, in one place.
 *
 * They used to be a segmented control taking a permanent strip across the top of
 * every month, to answer a question asked once a session — and there was nowhere
 * to put sorting without taking another strip.
 *
 * It stays open after a choice. Sorting is usually adjusted twice in a row, and
 * a sheet that closes on the first tap makes the second one a round trip.
 */
export function FilterSheet({
  status,
  sort,
  onStatusChange,
  onSortChange,
  onClose,
}: FilterSheetProps) {
  return (
    <BottomSheet title="Filtros" onClose={onClose}>
      <Group label="Situação">
        {STATUSES.map((option) => (
          <Choice
            key={option.value}
            label={option.label}
            chosen={option.value === status}
            onClick={() => onStatusChange(option.value)}
          />
        ))}
      </Group>

      <Group label="Ordenar por">
        {SORTS.map((option) => (
          <Choice
            key={option.value}
            label={option.label}
            chosen={option.value === sort}
            onClick={() => onSortChange(option.value)}
          />
        ))}
      </Group>
    </BottomSheet>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="pb-2">
      <p className="px-4 pt-2 pb-1 text-[0.6875rem] font-medium tracking-[0.08em] text-faint uppercase">
        {label}
      </p>

      {children}
    </section>
  )
}

function Choice({
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
      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
    >
      <span className="text-[0.9375rem] text-ink">{label}</span>

      {chosen && <CheckIcon className="size-4 shrink-0 text-accent" />}
    </button>
  )
}
