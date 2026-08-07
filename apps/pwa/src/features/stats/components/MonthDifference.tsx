import { monthLabel } from '../../../lib/dates'
import { compactBRL } from '../../../lib/money'
import type { Difference } from '../trend'

/**
 * What the chart just showed, said out loud.
 *
 * A colour tells someone the month went up and leaves them to work out whether
 * it matters. Two hundred reais over last month is a heavier week; two thousand
 * is a decision somebody made and may not remember making — and no bar height
 * separates those two, because the difference between them is a ratio the eye
 * has to compute against a neighbour it cannot measure.
 *
 * It names the month rather than saying "the previous one". Every month here is
 * reachable, so "the previous one" is a riddle whose answer depends on what is
 * selected, and the reader has to hold the calendar in their head to check the
 * sentence is even about what they think it is.
 *
 * The emoji is the only part that judges. Spending less is worth a small
 * celebration and spending more is worth a flinch, and both are read before the
 * sentence is — which is the point of putting them at the front. Neither is
 * scolding: the app does not know whether the month was a holiday or a hospital.
 */
export function MonthDifference({ gap }: { gap: Difference }) {
  const up = gap.direction === 'more'

  return (
    <p className={`px-4 text-[0.8125rem] ${up ? 'text-rise' : 'text-now'}`}>
      <span aria-hidden="true" className="pr-1.5">
        {up ? '\u{1F615}' : '\u{2B50}'}
      </span>

      Gastou <span className="tnum font-semibold">{compactBRL(gap.cents)}</span>{' '}
      {up ? 'a mais' : 'a menos'} que em{' '}
      <span className="first-letter:uppercase">{monthLabel(gap.previous)}</span>.
    </p>
  )
}
