import { monthLabel } from '../../../lib/dates'
import { splitBRL } from '../../../lib/money'
import { Card } from '../../../ui/Card'

interface RemainingCardProps {
  month: string
  remainingCents: number
  settledCount: number
  totalCount: number
}

/**
 * The question the app exists to answer, in the position the eye lands on after
 * the greeting.
 *
 * The progress bar counts items rather than money: a month is worked through
 * one bill at a time, and an amount-weighted bar would barely move while five
 * small bills were cleared — the opposite of the feedback the action deserves.
 */
export function RemainingCard({
  month,
  remainingCents,
  settledCount,
  totalCount,
}: RemainingCardProps) {
  const { head, tail } = splitBRL(remainingCents)
  const done = totalCount === 0 ? 0 : settledCount / totalCount
  const clear = totalCount > 0 && remainingCents === 0

  return (
    <Card className="px-5 py-5">
      <p className="text-sm text-muted">
        {clear ? 'Tudo pago em' : 'Falta pagar em'}{' '}
        <span className="capitalize">{monthLabel(month).replace(/ de \d+$/, '')}</span>
      </p>

      <p className="tnum pt-1 text-[2.25rem] leading-none font-semibold tracking-tight text-ink">
        {head}
        <span className="text-[0.55em] opacity-50">{tail}</span>
      </p>

      <div className="pt-5">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-sunken"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={settledCount}
          aria-label="Lançamentos pagos no mês"
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${done * 100}%` }} />
        </div>

        <p className="pt-2 text-xs text-muted">
          {settledCount} de {totalCount} {totalCount === 1 ? 'lançamento pago' : 'lançamentos pagos'}
        </p>
      </div>
    </Card>
  )
}
