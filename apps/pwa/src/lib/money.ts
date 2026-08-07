/**
 * Money is always an integer number of cents, everywhere — in the mock, over
 * the wire, and in the database. Floats are never introduced, not even for
 * display: `formatBRL` reads the integer directly rather than dividing first.
 */
export type Cents = number

const BRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatBRL(cents: Cents): string {
  const negative = cents < 0
  const absolute = Math.abs(cents)
  const body = BRL.format(absolute / 100)

  return `${negative ? '-' : ''}R$ ${body}`
}

/**
 * Splits at the decimal separator so the cents can be typeset smaller. Reading
 * a balance is about the order of magnitude; the cents are detail, and sizing
 * them the same competes with the part that carries the meaning.
 */
export function splitBRL(cents: Cents): { head: string; tail: string } {
  const formatted = formatBRL(cents)
  const at = formatted.lastIndexOf(',')

  return { head: formatted.slice(0, at), tail: formatted.slice(at) }
}

const BRL_ROUND = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/**
 * The same figure without the cents, for places that carry a value per column
 * and would rather be read than measured — a chart label, mostly. On a month's
 * total the cents are two digits that never change the answer, and they double
 * the width of a label that has to fit above a bar.
 */
export function roundBRL(cents: Cents): string {
  const negative = cents < 0

  return `${negative ? '-' : ''}R$ ${BRL_ROUND.format(Math.abs(cents) / 100)}`
}

const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Where the full form stops fitting above a bar: six figures. */
const COMPACT_FROM = 100_000

/**
 * The figure written to a width, for a label that has a column and not a line.
 *
 * Under a hundred thousand it is the plain number, because that is what a
 * household total looks like and rounding it would be answering a question
 * nobody asked. Above that it becomes "R$ 123,5 mil" — which is not a shortening
 * of the number so much as the honest reading of it: nobody compares two bars by
 * their last three digits, and the exact total is already set in full above the
 * chart for whichever month is chosen.
 *
 * Never an ellipsis. A truncated amount is a wrong amount that looks deliberate,
 * and "R$ 123.4…" cannot be told apart from a number ten times larger.
 */
export function compactBRL(cents: Cents): string {
  const negative = cents < 0
  const absolute = Math.abs(cents)

  /**
   * Rounded first, then measured. Reading the threshold off the cents lets
   * 99.999,99 through as being under six figures, and `roundBRL` then prints the
   * six figures anyway — a boundary that is wrong for exactly one cent's worth
   * of amounts, which is the kind nobody finds by hand.
   */
  if (Math.round(absolute / 100) < COMPACT_FROM) return roundBRL(cents)

  return `${negative ? '-' : ''}R$ ${BRL_COMPACT.format(absolute / 100)}`
}

/** As many digits as R$ 999.999.999,99 needs, and not one more. */
const MAX_DIGITS = 11

/**
 * Fills an amount from the right, the way a till does.
 *
 * `5` is five cents, `50` is fifty, `507` is five reais and seven, `50760` is
 * five hundred and seven sixty. Nobody types a separator and nobody places a
 * caret: the only two things that can happen are another digit and a backspace.
 *
 * This is how every banking app on the phone takes an amount, and the reason is
 * not fashion. A free text field asks for a decimal on a keyboard where the
 * comma and the full stop are both there and only one is right, then asks
 * whether the caret is before or after it — and "1.234,5" is a plausible thing
 * to be left holding when a thumb lands slightly wrong.
 */
export function digitsToInput(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS)

  if (digits === '') return ''

  return BRL.format(Number(digits) / 100)
}

export function parseBRLToCents(input: string): Cents | null {
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')

  if (cleaned === '' || cleaned === '-') return null

  const value = Number(cleaned)

  if (Number.isNaN(value)) return null

  return Math.round(value * 100)
}
