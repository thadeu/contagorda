import type { Status } from '../useStatusFilter'
import { Money } from '../../../ui/Money'

interface StatusTabsProps {
  status: Status
  onChange: (status: Status) => void
  pendingCount: number
  pendingCents: number
}

/**
 * The pending tab carries its count and total, because that pair is the whole
 * answer to "am I okay this month" — how many things are left and how much they
 * add up to. Making someone open the tab to find out would hide the one number
 * they came for.
 */
export function StatusTabs({ status, onChange, pendingCount, pendingCents }: StatusTabsProps) {
  return (
    <div className="flex gap-2 px-4 pt-3" role="tablist" aria-label="Situação">
      <Tab selected={status === 'pending'} onClick={() => onChange('pending')}>
        <span>A pagar</span>
        {pendingCount > 0 && (
          <span className="tnum rounded-full bg-out-dim/30 px-1.5 py-0.5 font-mono text-[0.6875rem] text-out">
            {pendingCount}
          </span>
        )}
      </Tab>

      <Tab selected={status === 'paid'} onClick={() => onChange('paid')}>
        Pago
      </Tab>

      {status === 'pending' && pendingCents > 0 && (
        <p className="ml-auto self-center text-xs text-muted">
          falta <Money cents={pendingCents} className="text-xs text-text" />
        </p>
      )}
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
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
        selected
          ? 'border-hairline-strong bg-raised text-text'
          : 'border-transparent text-faint hover:text-muted'
      }`}
    >
      {children}
    </button>
  )
}
