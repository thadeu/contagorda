import { monthKey, monthLabel, shiftMonth, todayIso } from '../../../lib/dates'

interface MonthHeaderProps {
  month: string
  onChange: (month: string) => void
}

/**
 * The month is the app's main axis, so it stays reachable from every screen
 * rather than living in a filter someone has to go find.
 */
// No safe-area padding here: this sits below the toolbar, which already accounts
// for it, and adding it again pushes the month down a second time.
export function MonthHeader({ month, onChange }: MonthHeaderProps) {
  const current = month === monthKey(todayIso())

  return (
    <header className="flex items-center justify-between px-4 pt-3 pb-2">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mês anterior"
        className="grid size-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-text"
      >
        ‹
      </button>

      <h2
        className={`font-display text-base capitalize ${current ? 'text-text' : 'text-muted'}`}
      >
        {monthLabel(month)}
      </h2>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Próximo mês"
        className="grid size-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-text"
      >
        ›
      </button>
    </header>
  )
}
