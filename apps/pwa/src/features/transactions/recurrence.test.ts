import { describe, expect, it } from 'vitest'
import { clamped, describe as describeSeries, occurrences } from './recurrence'

describe('occurrences', () => {
  it('counts the first one, so six times means six rows', () => {
    const dates = occurrences('2026-08-10', { frequency: 'monthly', interval: 1, count: 6 })

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
    const dates = occurrences('2026-11-05', { frequency: 'monthly', interval: 1, count: 3 })

    expect(dates).toEqual(['2026-11-05', '2026-12-05', '2027-01-05'])
  })

  it('steps by the interval', () => {
    const dates = occurrences('2026-01-15', { frequency: 'monthly', interval: 3, count: 4 })

    expect(dates).toEqual(['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15'])
  })

  it('repeats yearly on the same day', () => {
    const dates = occurrences('2026-03-20', { frequency: 'yearly', interval: 1, count: 3 })

    expect(dates).toEqual(['2026-03-20', '2027-03-20', '2028-03-20'])
  })

  /**
   * The reason each date is computed from the start rather than from the one
   * before it. Chained, February's clamp would carry forward and the whole
   * series would quietly move to the 28th — invisible until someone reconciles a
   * statement a year later.
   */
  it('clamps February and returns to the day it was set to', () => {
    const dates = occurrences('2026-01-31', { frequency: 'monthly', interval: 1, count: 4 })

    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('finds the extra day in a leap year', () => {
    const dates = occurrences('2028-01-31', { frequency: 'monthly', interval: 1, count: 2 })

    expect(dates).toEqual(['2028-01-31', '2028-02-29'])
  })

  it('handles the 29th of February repeating yearly', () => {
    const dates = occurrences('2028-02-29', { frequency: 'yearly', interval: 1, count: 2 })

    expect(dates).toEqual(['2028-02-29', '2029-02-28'])
  })
})

describe('describe', () => {
  it('says how many and between which months', () => {
    const sentence = describeSeries('2026-08-10', {
      frequency: 'monthly',
      interval: 1,
      count: 12,
    })

    expect(sentence).toBe('12 lançamentos, de agosto de 2026 a julho de 2027.')
  })

  it('says plainly when there is no series at all', () => {
    expect(describeSeries('2026-08-10', { frequency: 'monthly', interval: 1, count: 1 })).toBe(
      'Um lançamento só.',
    )
  })
})

describe('clamped', () => {
  it('notices when a month moved the day', () => {
    expect(clamped('2026-01-31', { frequency: 'monthly', interval: 1, count: 3 })).toBe(true)
  })

  it('stays quiet when every month has the day', () => {
    expect(clamped('2026-01-10', { frequency: 'monthly', interval: 1, count: 12 })).toBe(false)
  })
})
