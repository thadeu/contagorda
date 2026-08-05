import { monthKey, monthLabel, shiftMonth, todayIso } from '../../../lib/dates'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../ui/icons'

interface MonthHeaderProps {
  month: string
  onChange: (month: string) => void
}

/**
 * The greeting and the month sit together at the top, the way the platform
 * opens a screen: who you are, then what you are looking at. The month is the
 * app's main axis, so it stays here rather than inside a filter someone has to
 * go find.
 */
export function MonthHeader({ month, onChange }: MonthHeaderProps) {
  const current = month === monthKey(todayIso())

  return (
    <header className="px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4">
      <p className="text-sm text-muted">Conta Gorda</p>

      <div className="flex items-center justify-between pt-0.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight capitalize">
          {monthLabel(month)}
        </h1>

        <div className="flex shrink-0 items-center gap-1">
          <NavButton label="Mês anterior" onClick={() => onChange(shiftMonth(month, -1))}>
            <ChevronLeftIcon className="size-4" />
          </NavButton>
          <NavButton
            label="Próximo mês"
            onClick={() => onChange(shiftMonth(month, 1))}
            dimmed={current}
          >
            <ChevronRightIcon className="size-4" />
          </NavButton>
        </div>
      </div>
    </header>
  )
}

function NavButton({
  label,
  onClick,
  dimmed = false,
  children,
}: {
  label: string
  onClick: () => void
  dimmed?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`card-shadow grid size-9 place-items-center rounded-full bg-surface ${
        dimmed ? 'text-faint' : 'text-ink'
      }`}
    >
      {children}
    </button>
  )
}
