import { useState } from 'react'
import { splitBRL } from '../../../lib/money'
import { Money } from '../../../ui/Money'
import { BottomSheet } from '../../../ui/BottomSheet'
import { InfoIcon } from '../../../ui/icons'
import { MonthPicker } from './MonthPicker'

interface MonthStackProps {
  month: string
  onMonthChange: (month: string) => void
  remainingCents: number
  paidCents: number
  totalCents: number
}

/**
 * Two cards, one genuinely on top of the other.
 *
 * The dark card carries real height below the month row and the white one is
 * pulled up over it, inset at the sides and running past the bottom edge. That
 * overlap is the whole effect: matching their edges would read as a border
 * around a card, which is what a few pixels of padding produces and why it
 * looked flat.
 *
 * It buys depth without the curved full-bleed header that dates a design, and
 * gives the month somewhere to live that is not competing with the figure.
 */
export function MonthStack({
  month,
  onMonthChange,
  remainingCents,
  paidCents,
  totalCents,
}: MonthStackProps) {
  const [explaining, setExplaining] = useState(false)
  const { head, tail } = splitBRL(remainingCents)
  const progress = totalCents === 0 ? 0 : Math.min(paidCents / totalCents, 1)
  const clear = totalCents > 0 && remainingCents === 0

  return (
    <section>
      <div className="rounded-card bg-brand px-3 pt-3 pb-14">
        <div className="flex items-center justify-between">
          <MonthPicker month={month} onChange={onMonthChange} />

          <button
            type="button"
            onClick={() => setExplaining(true)}
            aria-label="O que este valor considera"
            className="grid size-9 place-items-center rounded-full bg-white/12 text-white"
          >
            <InfoIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="card-shadow relative mx-3 -mt-10 rounded-[1.25rem] border border-dashed border-line bg-surface px-5 py-5">
        <p className="text-sm text-muted">{clear ? 'Tudo pago' : 'Falta pagar'}</p>

        <p className="tnum pt-1 text-[2.25rem] leading-none font-bold tracking-[-0.02em] text-ink">
          {head}
          <span className="text-[0.55em] font-semibold opacity-45">{tail}</span>
        </p>

        <div className="pt-5">
          <ProgressTrack value={progress} />

          <div className="flex items-baseline justify-between pt-2.5 text-xs text-muted">
            <span>
              Pago <Money cents={paidCents} className="text-xs text-ink" />
            </span>
            <span>
              de <Money cents={totalCents} className="text-xs text-ink" />
            </span>
          </div>
        </div>
      </div>

      {explaining && (
        <BottomSheet title="Falta pagar" onClose={() => setExplaining(false)}>
          <p className="px-4 pb-4 text-[0.9375rem] leading-relaxed text-muted">
            É a soma das saídas deste mês que ainda não foram marcadas como pagas. Entradas não
            entram nessa conta, e o que já foi pago sai dela assim que você marca.
          </p>
        </BottomSheet>
      )}
    </section>
  )
}

/**
 * The spent part is solid, the rest is hatched. Stripes read as "not yet" in a
 * way a flat grey does not — it looks like space still to be filled instead of
 * a track that happens to be empty.
 */
function ProgressTrack({ value }: { value: number }) {
  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-sunken"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label="Parte do mês já paga"
      style={{
        backgroundImage:
          'repeating-linear-gradient(115deg, transparent 0 5px, rgba(13,20,16,0.07) 5px 10px)',
      }}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${value * 100}%` }} />
    </div>
  )
}
