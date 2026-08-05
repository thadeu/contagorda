import type { Status } from '../useStatusFilter'

interface StatusTabsProps {
  status: Status
  onChange: (status: Status) => void
  pendingCount: number
}

/**
 * A segmented control, the platform's own device for switching between two
 * views of the same thing. The pending tab carries its count, because "how many
 * are left" is the number someone opens the app for and hiding it behind a tap
 * would hide the answer.
 */
export function StatusTabs({ status, onChange, pendingCount }: StatusTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-full bg-sunken p-1"
      role="tablist"
      aria-label="Situação"
    >
      <Tab selected={status === 'pending'} onClick={() => onChange('pending')}>
        A pagar
        {pendingCount > 0 && (
          <span className="tnum rounded-full bg-out/15 px-1.5 text-[0.6875rem] font-semibold text-out">
            {pendingCount}
          </span>
        )}
      </Tab>

      <Tab selected={status === 'paid'} onClick={() => onChange('paid')}>
        Pago
      </Tab>
    </div>
  )
}

function Tab({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium ${
        selected ? 'bg-surface text-ink shadow-sm' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}
