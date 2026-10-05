import { useState } from 'react'
import { monthKey, monthLabel, monthShortLabel, shiftMonth, todayIso } from '@/lib/dates'
import { BottomSheet } from '@/ui/BottomSheet'
import { Button } from '@/ui/Button'

interface CloneMonthSheetProps {
  /** The month whose rows are being copied. */
  source: string
  pending: boolean
  /** What the server said, already in Portuguese, when it refused. */
  error: string | null
  onSubmit: (target: string) => void
  onClose: () => void
}

/** A year ahead of the source: far enough to plan, short enough to fit on screen. */
const SPAN = 12

/**
 * Where the rows of a month should go.
 *
 * The months a copy can land in are the twelve after the source, and the nearest
 * is already chosen. Copying forward is what this is for — a new month starts as
 * the last one did — so the common case is one tap on the button and the rare
 * one is one tap on a month first.
 *
 * Laid out as a grid and not as a list, so all twelve are visible at once and
 * the button under them never scrolls out of reach.
 */
export function CloneMonthSheet({ source, pending, error, onSubmit, onClose }: CloneMonthSheetProps) {
  const options = Array.from({ length: SPAN }, (_, index) => shiftMonth(source, index + 1))
  const current = monthKey(todayIso())

  const [target, setTarget] = useState(options[0])

  return (
    <BottomSheet title="Copiar lançamentos" subtitle={`De ${monthLabel(source)}`} onClose={onClose}>
      <div className="grid gap-4 px-1 pb-2">
        <div role="radiogroup" aria-label="Mês de destino" className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === target}
              aria-label={monthLabel(option)}
              onClick={() => setTarget(option)}
              className={`grid min-h-14 place-items-center rounded-control px-2 py-2 text-center ${
                option === target ? 'bg-brand text-white' : 'bg-sunken text-ink'
              }`}
            >
              <span className="text-[0.9375rem] font-semibold capitalize">
                {monthShortLabel(option).split(' ')[0]}
              </span>

              <span
                className={`tnum text-xs ${option === target ? 'text-white/70' : 'text-muted'}`}
              >
                {option === current ? 'atual' : option.slice(0, 4)}
              </span>
            </button>
          ))}
        </div>

        <p className="px-2 text-xs leading-relaxed text-muted">
          Cada lançamento vem com a mesma conta, categoria e valor, no mesmo dia, e nenhum vem como
          pago. Os recorrentes que já estão no mês de destino não são copiados de novo.
        </p>

        {error && (
          <p role="alert" className="px-2 text-sm font-medium text-out">
            {error}
          </p>
        )}

        <Button type="button" disabled={pending} onClick={() => onSubmit(target)}>
          {pending ? 'Copiando…' : `Copiar para ${monthLabel(target)}`}
        </Button>
      </div>
    </BottomSheet>
  )
}
