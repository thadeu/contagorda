import { formatBRL, splitBRL, type Cents } from '@/lib/money'

type Tone = 'default' | 'in' | 'out' | 'muted'

interface MoneyProps {
  cents: Cents
  tone?: Tone
  /** Renders the cents smaller — for headline figures, not list rows. */
  emphasis?: boolean
  /** Drops the R$ prefix, for rows where the column already reads as money. */
  bare?: boolean
  className?: string
}

const TONES: Record<Tone, string> = {
  default: 'text-ink',
  in: 'text-in',
  out: 'text-out',
  muted: 'text-muted',
}

/**
 * Every amount goes through here.
 *
 * There is no automatic red for expenses. Nearly every row in this app is one,
 * so colouring them all would distinguish nothing — the caller passes `out` for
 * the rows that genuinely need attention, which in practice means overdue.
 */
export function Money({ cents, tone = 'default', emphasis = false, bare = false, className = '' }: MoneyProps) {
  const text = bare ? formatBRL(cents).replace('R$ ', '') : formatBRL(cents)

  if (!emphasis) {
    return <span className={`tnum ${TONES[tone]} ${className}`}>{text}</span>
  }

  const { head, tail } = splitBRL(cents)

  return (
    <span className={`tnum ${TONES[tone]} ${className}`}>
      {bare ? head.replace('R$ ', '') : head}
      <span className="text-[0.55em] opacity-55">{tail}</span>
    </span>
  )
}
