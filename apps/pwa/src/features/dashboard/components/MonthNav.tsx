import { monthKey, monthLabel, shiftMonth, todayIso } from '../../../lib/dates'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../ui/icons'

interface MonthNavProps {
  month: string
  onChange: (month: string) => void
}

/**
 * Sits in the header beside the greeting. The month is the app's main axis, so
 * it stays visible rather than living inside a filter someone has to go find.
 */
export function MonthNav({ month, onChange }: MonthNavProps) {
  const current = month === monthKey(todayIso())
  const short = monthLabel(month).replace(/ de \d+$/, '').slice(0, 3)

  return (
    <div className="flex items-center gap-1">
      <NavButton label="Mês anterior" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeftIcon className="size-4" />
      </NavButton>

      <span className="min-w-11 text-center text-sm font-medium text-white/85 capitalize">
        {short}
      </span>

      <NavButton
        label="Próximo mês"
        onClick={() => onChange(shiftMonth(month, 1))}
        dimmed={current}
      >
        <ChevronRightIcon className="size-4" />
      </NavButton>
    </div>
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
      className={`grid size-8 place-items-center rounded-full bg-white/10 ${
        dimmed ? 'text-white/40' : 'text-white'
      }`}
    >
      {children}
    </button>
  )
}
