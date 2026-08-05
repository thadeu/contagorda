import { monthKey, monthLabel, shiftMonth, todayIso } from '../../../lib/dates'
import { splitBRL } from '../../../lib/money'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../ui/icons'

interface MonthHeroProps {
  month: string
  onChange: (month: string) => void
  remainingCents: number
  settledCount: number
  totalCount: number
}

/**
 * The dark surface runs to the top edge rather than floating as a card.
 *
 * That is what makes a translucent status bar work: iOS draws the clock and
 * battery in white over whatever is behind them, so the top of the screen has
 * to be dark for them to be readable at all. Extending the hero solves it
 * without a strip of colour that would read as a mistake.
 *
 * It carries the question the app exists to answer — what is left to pay — and
 * the progress bar counts items rather than money, because a month is worked
 * through one bill at a time and an amount-weighted bar would barely move while
 * five small bills were cleared.
 */
export function MonthHero({
  month,
  onChange,
  remainingCents,
  settledCount,
  totalCount,
}: MonthHeroProps) {
  const current = month === monthKey(todayIso())
  const { head, tail } = splitBRL(remainingCents)
  const done = totalCount === 0 ? 0 : settledCount / totalCount
  const clear = totalCount > 0 && remainingCents === 0

  return (
    <section className="rounded-b-card bg-brand px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Conta Gorda</p>

        <div className="flex items-center gap-1">
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

      <h1 className="pt-3 text-lg font-medium capitalize">{monthLabel(month)}</h1>

      <p className="pt-4 text-sm text-white/60">{clear ? 'Tudo pago' : 'Falta pagar'}</p>
      <p className="tnum pt-0.5 text-[2.5rem] leading-none font-semibold tracking-tight">
        {head}
        <span className="text-[0.55em] opacity-60">{tail}</span>
      </p>

      <div className="pt-5">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={settledCount}
          aria-label="Lançamentos pagos no mês"
        >
          <div className="h-full rounded-full bg-lime" style={{ width: `${done * 100}%` }} />
        </div>

        <p className="pt-2 text-xs text-white/60">
          {settledCount} de {totalCount} {totalCount === 1 ? 'lançamento pago' : 'lançamentos pagos'}
        </p>
      </div>
    </section>
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
      className={`grid size-9 place-items-center rounded-full bg-white/10 ${
        dimmed ? 'text-white/40' : 'text-white'
      }`}
    >
      {children}
    </button>
  )
}
