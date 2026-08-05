import { describe, it, expect } from 'vitest'
import { buildMonthOptions } from './monthOptions'

describe('buildMonthOptions', () => {
  it('groups by year, newest first', () => {
    const groups = buildMonthOptions(['2026-03', '2025-11'], '2026-03')

    expect(groups.map((g) => g.year)).toEqual(['2026', '2025'])
    expect(groups[0].months).toEqual(['2026-03', '2026-02', '2026-01'])
    expect(groups[1].months).toEqual(['2025-12', '2025-11'])
  })

  // A missing month in the middle would read as a bug, and an empty month is a
  // legitimate thing to open — the sequence has to be continuous.
  it('fills the gap between months that hold data', () => {
    const groups = buildMonthOptions(['2026-06', '2026-02'], '2026-06')

    expect(groups[0].months).toEqual([
      '2026-06',
      '2026-05',
      '2026-04',
      '2026-03',
      '2026-02',
    ])
  })

  it('crosses the year boundary in the right order', () => {
    const groups = buildMonthOptions(['2026-01'], '2025-12')

    expect(groups).toEqual([
      { year: '2026', months: ['2026-01'] },
      { year: '2025', months: ['2025-12'] },
    ])
  })

  // A brand-new account has no data at all and still needs somewhere to be.
  it('offers the current month when nothing has data', () => {
    expect(buildMonthOptions([], '2026-08')).toEqual([
      { year: '2026', months: ['2026-08'] },
    ])
  })

  it('extends past the data to reach the current month', () => {
    const groups = buildMonthOptions(['2026-01'], '2026-04')

    expect(groups[0].months).toEqual(['2026-04', '2026-03', '2026-02', '2026-01'])
  })

  // Planning ahead puts transactions in the future, and those months have to be
  // reachable even though they are past today.
  it('keeps months later than the current one', () => {
    const groups = buildMonthOptions(['2026-10'], '2026-08')

    expect(groups[0].months[0]).toBe('2026-10')
    expect(groups[0].months).toContain('2026-08')
  })

  it('does not repeat a month present in both inputs', () => {
    const groups = buildMonthOptions(['2026-08'], '2026-08')

    expect(groups).toEqual([{ year: '2026', months: ['2026-08'] }])
  })
})
