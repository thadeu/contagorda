/**
 * Dates are ISO `YYYY-MM-DD` strings, never Date objects, everywhere they
 * travel. A transaction happens on a calendar day, not at an instant, and
 * putting it through `new Date()` drags a timezone in — which is how an expense
 * entered late at night ends up filed under the day before.
 */
export type IsoDate = string

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function todayIso(): IsoDate {
  const now = new Date()

  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function toIso(year: number, month: number, day: number): IsoDate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parts(date: IsoDate) {
  const [year, month, day] = date.split('-').map(Number)

  return { year, month, day }
}

export function monthKey(date: IsoDate): string {
  return date.slice(0, 7)
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)

  return `${MONTHS[month - 1]} de ${year}`
}

/**
 * Three letters and the year only when it changes.
 *
 * A chart of ten years cannot repeat "de 2026" under every bar — the year is
 * what separates one January from the next, and the month is what separates the
 * bars within a year. January carries both; everything else carries one.
 */
export function monthShortLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  const name = MONTHS[month - 1].slice(0, 3)

  return month === 1 ? `${name} ${String(year).slice(2)}` : name
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  const index = year * 12 + (month - 1) + delta

  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function dayLabel(date: IsoDate): string {
  const { year, month, day } = parts(date)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]

  return `${String(day).padStart(2, '0')} ${weekday}`
}

export function isToday(date: IsoDate): boolean {
  return date === todayIso()
}

export function isFuture(date: IsoDate): boolean {
  return date > todayIso()
}
