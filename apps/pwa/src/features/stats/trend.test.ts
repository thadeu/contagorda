import { describe, expect, it } from 'vitest'
import { ceiling, difference, read } from './trend'

function months(...amounts: number[]) {
  return amounts.map((expense_cents, index) => ({
    month: `2026-${String(index + 1).padStart(2, '0')}`,
    expense_cents,
    income_cents: 0,
  }))
}

function trends(amounts: number[], current = 'none') {
  return read(months(...amounts), current).map((reading) => reading.trend)
}

describe('read', () => {
  it('marks every month that cost more than the one before it', () => {
    expect(trends([50_000, 60_000, 70_000])).toEqual(['steady', 'rise', 'rise'])
  })

  it('lets a month that came back down go quiet again', () => {
    expect(trends([50_000, 60_000, 70_000, 55_000])).toEqual(['steady', 'rise', 'rise', 'steady'])
  })

  /**
   * The reason the whole thing exists: a wall of red says spending climbed every
   * month, and alternating colour says it moved around without a trend.
   */
  it('alternates when spending does', () => {
    expect(trends([50_000, 40_000, 60_000, 30_000])).toEqual([
      'steady',
      'steady',
      'rise',
      'steady',
    ])
  })

  it('never accuses the first month, which has nothing to its left', () => {
    expect(trends([90_000, 10_000])[0]).toBe('steady')
  })

  it('spends nothing on a month that stayed exactly level', () => {
    expect(trends([50_000, 50_000])).toEqual(['steady', 'steady'])
  })

  /**
   * Whichever way it went. It is the only month still being written, so a
   * verdict on it is a verdict on however many days have passed.
   */
  it('always calls the current month what it is', () => {
    expect(trends([50_000, 90_000], '2026-02')).toEqual(['steady', 'now'])
    expect(trends([90_000, 50_000], '2026-02')).toEqual(['steady', 'now'])
  })
})

describe('peak and floor', () => {
  it('finds the most and the least spent', () => {
    const readings = read(months(50_000, 90_000, 20_000), 'none')

    expect(readings.filter((r) => r.peak).map((r) => r.month)).toEqual(['2026-02'])
    expect(readings.filter((r) => r.floor).map((r) => r.month)).toEqual(['2026-03'])
  })

  /**
   * An empty month is missing data, not a cheap month — and the case where it
   * matters is exactly the one where someone forgot to enter anything.
   */
  it('does not call a month with nothing in it the cheapest', () => {
    const readings = read(months(50_000, 0, 20_000), 'none')

    expect(readings.filter((r) => r.floor).map((r) => r.month)).toEqual(['2026-03'])
  })

  it('claims neither when there is nothing on record', () => {
    const readings = read(months(0, 0), 'none')

    expect(readings.some((r) => r.peak || r.floor)).toBe(false)
  })
})

describe('ceiling', () => {
  const history = months(10_000, 10_000, 10_000, 900_000, 10_000, 12_000, 14_000, 16_000)

  /**
   * The whole reason it is a window. Measured against everything, a single month
   * with a car in it is the yardstick forever and every later month is a sliver.
   */
  it('forgets an outlier once it is out of range', () => {
    expect(ceiling(read(history, 'none'), '2026-08')).toBe(16_000)
  })

  it('still answers to it while it is in range', () => {
    expect(ceiling(read(history, 'none'), '2026-05')).toBe(900_000)
  })

  it('reaches three months either side', () => {
    expect(ceiling(read(history, 'none'), '2026-07')).toBe(900_000)
  })

  it('does not fall off the start of the history', () => {
    expect(ceiling(read(history, 'none'), '2026-01')).toBe(900_000)
  })
})

describe('difference', () => {
  it('says how much more, and against which month', () => {
    const gap = difference(read(months(50_000, 62_000), 'none'), '2026-02')

    expect(gap).toEqual({ cents: 12_000, direction: 'more', previous: '2026-01' })
  })

  it('reports a drop as a positive amount going the other way', () => {
    const gap = difference(read(months(62_000, 50_000), 'none'), '2026-02')

    expect(gap).toEqual({ cents: 12_000, direction: 'less', previous: '2026-01' })
  })

  /** A line that says "the same" is charging rent to say nothing. */
  it('says nothing when the months are level', () => {
    expect(difference(read(months(50_000, 50_000), 'none'), '2026-02')).toBeNull()
  })

  it('says nothing about the first month, which has nothing behind it', () => {
    expect(difference(read(months(50_000, 60_000), 'none'), '2026-01')).toBeNull()
  })
})
