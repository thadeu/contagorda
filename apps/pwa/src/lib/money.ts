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

export function parseBRLToCents(input: string): Cents | null {
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')

  if (cleaned === '' || cleaned === '-') return null

  const value = Number(cleaned)

  if (Number.isNaN(value)) return null

  return Math.round(value * 100)
}
