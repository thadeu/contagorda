import { describe, expect, it } from 'vitest'
import {
  cadence,
  clamped,
  describe as describeSeries,
  occurrences,
  recurrenceFrom,
  sameRecurrence,
} from './recurrence'

describe('occurrences', () => {
  it('counts repetitions after this one, so five more means six rows', () => {
    const dates = occurrences('2026-08-10', { frequency: 'monthly', interval: 1, repeats: 5 })

    expect(dates).toEqual([
      '2026-08-10',
      '2026-09-10',
      '2026-10-10',
      '2026-11-10',
      '2026-12-10',
      '2027-01-10',
    ])
  })

  it('crosses the year without help', () => {
    const dates = occurrences('2026-11-05', { frequency: 'monthly', interval: 1, repeats: 2 })

    expect(dates).toEqual(['2026-11-05', '2026-12-05', '2027-01-05'])
  })

  it('steps by the interval', () => {
    const dates = occurrences('2026-01-15', { frequency: 'monthly', interval: 3, repeats: 3 })

    expect(dates).toEqual(['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15'])
  })

  it('repeats yearly on the same day', () => {
    const dates = occurrences('2026-03-20', { frequency: 'yearly', interval: 1, repeats: 2 })

    expect(dates).toEqual(['2026-03-20', '2027-03-20', '2028-03-20'])
  })

  /**
   * The reason each date is computed from the start rather than from the one
   * before it. Chained, February's clamp would carry forward and the whole
   * series would quietly move to the 28th — invisible until someone reconciles a
   * statement a year later.
   */
  it('clamps February and returns to the day it was set to', () => {
    const dates = occurrences('2026-01-31', { frequency: 'monthly', interval: 1, repeats: 3 })

    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('finds the extra day in a leap year', () => {
    const dates = occurrences('2028-01-31', { frequency: 'monthly', interval: 1, repeats: 1 })

    expect(dates).toEqual(['2028-01-31', '2028-02-29'])
  })

  it('handles the 29th of February repeating yearly', () => {
    const dates = occurrences('2028-02-29', { frequency: 'yearly', interval: 1, repeats: 1 })

    expect(dates).toEqual(['2028-02-29', '2029-02-28'])
  })
})

describe('describe', () => {
  it('says where it ends, which is the part nobody can work out', () => {
    const sentence = describeSeries('2026-08-10', {
      frequency: 'monthly',
      interval: 1,
      repeats: 11,
    })

    expect(sentence).toBe('Até julho de 2027.')
  })

  it('says plainly when nothing repeats', () => {
    expect(describeSeries('2026-08-10', { frequency: 'monthly', interval: 1, repeats: 0 })).toBe(
      'Um lançamento só.',
    )
  })
})

describe('clamped', () => {
  it('notices when a month moved the day', () => {
    expect(clamped('2026-01-31', { frequency: 'monthly', interval: 1, repeats: 2 })).toBe(true)
  })

  it('stays quiet when every month has the day', () => {
    expect(clamped('2026-01-10', { frequency: 'monthly', interval: 1, repeats: 11 })).toBe(false)
  })
})

describe('the shortest series', () => {
  /**
   * One repetition is the smallest thing worth calling a series: this month and
   * the next. A field that only offered a list of counts never had it, because
   * the number missing from any list is the one being entered.
   */
  it('is this one and the next', () => {
    const dates = occurrences('2026-08-10', { frequency: 'monthly', interval: 1, repeats: 1 })

    expect(dates).toEqual(['2026-08-10', '2026-09-10'])
  })

  it('ends next month', () => {
    expect(describeSeries('2026-08-10', { frequency: 'monthly', interval: 1, repeats: 1 })).toBe(
      'Até setembro de 2026.',
    )
  })
})

describe('recurrenceFrom', () => {
  const monthly = { frequency: 'monthly', interval: 1 } as const

  it('counts the repeats left after the row being looked at', () => {
    const rule = { ...monthly, ends_on: '2026-12-10' }

    expect(recurrenceFrom('2026-08-10', rule)).toEqual({ ...monthly, repeats: 4 })
    expect(recurrenceFrom('2026-11-10', rule)).toEqual({ ...monthly, repeats: 1 })
  })

  it('has nothing left on the last row', () => {
    expect(recurrenceFrom('2026-12-10', { ...monthly, ends_on: '2026-12-10' }).repeats).toBe(0)
  })

  // Cutting a series short ends it the day before the occurrence that was
  // removed. October 10th is gone, so from August there is one left, not two.
  it('does not count an occurrence the series was cut short of', () => {
    expect(recurrenceFrom('2026-08-10', { ...monthly, ends_on: '2026-10-09' }).repeats).toBe(1)
  })

  it('follows a month that clamped the day', () => {
    expect(recurrenceFrom('2026-01-31', { ...monthly, ends_on: '2026-03-31' }).repeats).toBe(2)
    expect(recurrenceFrom('2026-01-31', { ...monthly, ends_on: '2026-02-28' }).repeats).toBe(1)
  })

  it('steps by the interval', () => {
    const rule = { frequency: 'monthly', interval: 2, ends_on: '2026-11-10' } as const

    expect(recurrenceFrom('2026-05-10', rule)).toEqual({ frequency: 'monthly', interval: 2, repeats: 3 })
  })

  it('reads a yearly series in years', () => {
    const rule = { frequency: 'yearly', interval: 1, ends_on: '2029-03-20' } as const

    expect(recurrenceFrom('2026-03-20', rule).repeats).toBe(3)
  })

  it('treats a series with no end as ending here', () => {
    expect(recurrenceFrom('2026-08-10', { ...monthly, ends_on: null }).repeats).toBe(0)
  })

  it('agrees with the schedule it describes', () => {
    const from = '2026-08-10'
    const dates = occurrences(from, { ...monthly, repeats: 6 })
    const rule = { ...monthly, ends_on: dates[dates.length - 1] }

    expect(occurrences(from, recurrenceFrom(from, rule))).toEqual(dates)
  })
})

describe('sameRecurrence', () => {
  const a = { frequency: 'monthly', interval: 1, repeats: 3 } as const

  it('compares every part of the rule', () => {
    expect(sameRecurrence(a, { ...a })).toBe(true)
    expect(sameRecurrence(a, { ...a, repeats: 4 })).toBe(false)
    expect(sameRecurrence(a, { ...a, interval: 2 })).toBe(false)
    expect(sameRecurrence(a, { ...a, frequency: 'yearly' })).toBe(false)
  })

  it('tells no rule from a rule', () => {
    expect(sameRecurrence(null, null)).toBe(true)
    expect(sameRecurrence(a, null)).toBe(false)
    expect(sameRecurrence(null, a)).toBe(false)
  })
})

describe('cadence', () => {
  it('says it the way a person does', () => {
    expect(cadence({ frequency: 'monthly', interval: 1 })).toBe('Todo mês')
    expect(cadence({ frequency: 'monthly', interval: 2 })).toBe('A cada 2 meses')
    expect(cadence({ frequency: 'yearly', interval: 1 })).toBe('Todo ano')
    expect(cadence({ frequency: 'yearly', interval: 3 })).toBe('A cada 3 anos')
  })
})
