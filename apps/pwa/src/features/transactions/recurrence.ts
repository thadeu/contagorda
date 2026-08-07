import { monthLabel, monthKey, toIso, parts, type IsoDate } from '@/lib/dates'

export type Frequency = 'monthly' | 'yearly'

export interface Recurrence {
  frequency: Frequency
  /** Every how many months or years. One for "every month". */
  interval: number
  /**
   * How many times it repeats after this one. One means "and again next month",
   * which is two rows in total.
   *
   * Named the way the form asks it — "se repete por" — rather than as a total,
   * because the two differ by one and the difference is invisible in a field
   * showing a number. A domain that counts occurrences and a label that counts
   * repetitions is an off-by-one waiting for someone.
   */
  repeats: number
}

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'monthly', label: 'Mês' },
  { value: 'yearly', label: 'Ano' },
]

/**
 * Every date in a series, anchored to the first one.
 *
 * Each occurrence is computed from the start rather than from the one before
 * it. A series that begins on the 31st gives the 28th in February and returns
 * to the 31st in March; chaining would let February's clamp poison every month
 * after it, and a year later the whole series has quietly moved to the 28th.
 * That drift is invisible until someone reconciles a statement.
 *
 * Counted rather than bounded by a date, because "every two months for six
 * months" has two defensible answers and "six more times" has one.
 */
export function occurrences(start: IsoDate, { frequency, interval, repeats }: Recurrence): IsoDate[] {
  const { year, month, day } = parts(start)
  const step = frequency === 'yearly' ? interval * 12 : interval

  return Array.from({ length: repeats + 1 }, (_, index) => {
    const target = month - 1 + index * step
    const targetYear = year + Math.floor(target / 12)
    const targetMonth = (target % 12) + 1

    return toIso(targetYear, targetMonth, Math.min(day, daysIn(targetYear, targetMonth)))
  })
}

/**
 * What the series will do, in a sentence.
 *
 * The controls state a rule and this states its consequence, which is the part
 * anyone actually wants to agree to. It is also where the clamped days show
 * themselves: nobody reasons about February from an interval, and everybody
 * recognises a date that ends where they did not expect.
 *
 * The count is left out. It is already on screen, in the field that set it, and
 * repeating it here only invites the reader to check one number against another
 * — while the months are the thing they cannot work out for themselves.
 */
export function describe(start: IsoDate, recurrence: Recurrence): string {
  const dates = occurrences(start, recurrence)
  const last = dates[dates.length - 1]

  if (dates.length < 2) {
    return 'Um lançamento só.'
  }

  return `De ${monthLabel(monthKey(dates[0]))} a ${monthLabel(monthKey(last))}.`
}

/** True when a clamped month moved a date off the day the series was set to. */
export function clamped(start: IsoDate, recurrence: Recurrence): boolean {
  const { day } = parts(start)

  return occurrences(start, recurrence).some((date) => parts(date).day !== day)
}

function daysIn(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
