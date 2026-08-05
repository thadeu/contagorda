import { formatBRL, splitBRL, type Cents } from '../lib/money'

interface MoneyProps {
  cents: Cents
  /** Colours the value by direction. Off for neutral figures like a category total. */
  signed?: boolean
  /** Renders the cents smaller — for headline figures, not list rows. */
  emphasis?: boolean
  className?: string
}

/**
 * Every amount on screen goes through here.
 *
 * The cents are typeset smaller on headline figures because reading a balance
 * is about order of magnitude; giving the cents equal weight makes them compete
 * with the part that carries the meaning. In list rows they stay full size,
 * where the column is scanned rather than read.
 */
export function Money({ cents, signed = false, emphasis = false, className = '' }: MoneyProps) {
  const tone = !signed ? 'text-text' : cents < 0 ? 'text-out' : 'text-in'

  if (!emphasis) {
    return (
      <span className={`tnum font-mono ${tone} ${className}`}>{formatBRL(cents)}</span>
    )
  }

  const { head, tail } = splitBRL(cents)

  return (
    <span className={`tnum font-mono ${tone} ${className}`}>
      {head}
      <span className="text-[0.6em] align-baseline opacity-55">{tail}</span>
    </span>
  )
}
