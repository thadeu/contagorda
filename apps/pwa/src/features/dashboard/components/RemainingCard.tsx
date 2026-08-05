import { splitBRL } from '../../../lib/money'

interface RemainingCardProps {
  remainingCents: number
  settledCount: number
  totalCount: number
}

/**
 * The one dark surface in the app, carrying the one question it exists to
 * answer: how much is still to pay this month.
 *
 * The progress bar counts items, not money, because that is how the month is
 * actually worked through — one bill at a time. A bar weighted by amount would
 * sit almost still while five small bills were cleared, which is the opposite of
 * the feedback the action deserves.
 */
export function RemainingCard({ remainingCents, settledCount, totalCount }: RemainingCardProps) {
  const { head, tail } = splitBRL(remainingCents)
  const done = totalCount === 0 ? 0 : settledCount / totalCount
  const clear = remainingCents === 0

  return (
    <section className="rounded-[--radius-card] bg-brand px-5 py-6 text-white">
      <p className="text-sm text-white/60">{clear ? 'Tudo pago' : 'Falta pagar'}</p>

      <p className="tnum pt-1 text-[2.5rem] leading-none font-semibold tracking-tight">
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
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-500"
            style={{ width: `${done * 100}%` }}
          />
        </div>

        <p className="pt-2 text-xs text-white/60">
          {settledCount} de {totalCount} {totalCount === 1 ? 'lançamento pago' : 'lançamentos pagos'}
        </p>
      </div>
    </section>
  )
}
