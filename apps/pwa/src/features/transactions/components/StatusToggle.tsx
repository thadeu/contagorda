import { PaidIcon, PendingIcon } from '@/ui/icons'
import type { AppIcon } from '@/ui/icons'
import type { Kind, Status } from '@/features/transactions/useStatusFilter'

interface StatusToggleProps {
  status: Status
  kind: Kind
  onChange: (status: Status) => void
}

const OPTIONS: { value: Status; label: Record<Kind, string>; icon: AppIcon; active: string }[] = [
  {
    value: 'pending',
    label: { expense: 'A pagar', income: 'A receber' },
    icon: PendingIcon,
    active: 'bg-surface text-ink shadow-sm',
  },
  {
    value: 'paid',
    label: { expense: 'Pagos', income: 'Recebidos' },
    icon: PaidIcon,
    active: 'bg-in text-white shadow-sm',
  },
]

/**
 * Which list is showing, beside the button that adds to it.
 *
 * It used to live inside the filter sheet, two taps deep, which is where a
 * question asked once a session belongs — except this one is asked constantly:
 * the flick from what is owed to what has been paid is the main thing the list
 * is for. Two icons in one pill, the same height as the buttons beside it, so
 * the state is always visible and never costs a sheet to change.
 */
export function StatusToggle({ status, kind, onChange }: StatusToggleProps) {
  return (
    <div role="group" aria-label="Situação" className="flex h-10 shrink-0 rounded-2xl bg-sunken p-1">
      {OPTIONS.map(({ value, label, icon: Icon, active: activeClass }) => {
        const active = value === status

        return (
          <button
            key={value}
            type="button"
            aria-label={label[kind]}
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={`grid w-9 place-items-center rounded-xl transition-colors ${
              active ? activeClass : 'text-faint'
            }`}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
