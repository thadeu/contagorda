import { describe, expect, it } from 'vitest'
import { compactBRL, digitsToInput, formatBRL, roundBRL } from './money'

describe('roundBRL', () => {
  it('drops the cents without touching the thousands separator', () => {
    expect(roundBRL(403_712)).toBe('R$ 4.037')
  })

  it('keeps the sign', () => {
    expect(roundBRL(-403_712)).toBe('-R$ 4.037')
  })
})

describe('compactBRL', () => {
  /**
   * A household month is four or five figures and reads as itself. Rounding
   * those to "R$ 4 mil" would answer a question nobody asked.
   */
  it('writes an ordinary month in full', () => {
    expect(compactBRL(403_712)).toBe('R$ 4.037')
    expect(compactBRL(9_999_899)).toBe('R$ 99.999')
  })

  /**
   * The space inside "100 mil" is a non-breaking one, straight from `Intl`, and
   * it stays that way: a label that is allowed to break between the number and
   * its magnitude can print "100" on one line and "mil" on the next, which is
   * the exact failure this function exists to prevent.
   */
  it('switches to words once the digits stop fitting', () => {
    expect(compactBRL(10_000_000)).toBe('R$ 100\u00a0mil')
    expect(compactBRL(12_345_678)).toBe('R$ 123,5\u00a0mil')
    expect(compactBRL(123_456_789)).toBe('R$ 1,2\u00a0mi')
  })

  /**
   * The last cents before the threshold round up into six figures, so the
   * decision has to be made on the rounded value or the boundary is wrong for
   * exactly one cent's worth of amounts.
   */
  it('switches on what it will print, not on what it was given', () => {
    expect(compactBRL(9_999_999)).toBe('R$ 100\u00a0mil')
  })

  /**
   * The reason this exists. The label sits in a column barely wider than the bar
   * it belongs to, and a figure that wraps takes the whole chart's baseline with
   * it. Every amount anyone could enter has to fit on one line — so the width is
   * asserted, not eyeballed.
   */
  it('never grows past what the column holds', () => {
    const amounts = [0, 1, 99_99, 403_712, 9_999_999, 10_000_000, 99_999_999, 123_456_789]
      .concat([999_999_999, 12_345_678_900, 999_999_999_999])

    for (const cents of amounts) {
      expect(compactBRL(cents).length, `${cents}`).toBeLessThanOrEqual(12)
    }
  })

  it('leaves the full form alone for everywhere else', () => {
    expect(formatBRL(403_712)).toBe('R$ 4.037,12')
  })
})

describe('digitsToInput', () => {
  /**
   * The whole point: an amount is built from the right, so the first digit is
   * cents and there is never a separator to type or a caret to place.
   */
  it('fills from the right', () => {
    expect(digitsToInput('5')).toBe('0,05')
    expect(digitsToInput('50')).toBe('0,50')
    expect(digitsToInput('507')).toBe('5,07')
    expect(digitsToInput('50760')).toBe('507,60')
  })

  it('groups the thousands as they arrive', () => {
    expect(digitsToInput('123456')).toBe('1.234,56')
  })

  /** A numeric keypad still offers a separator on some phones, and it means nothing here. */
  it('ignores anything that is not a digit', () => {
    expect(digitsToInput('1.234,56')).toBe('1.234,56')
    expect(digitsToInput('R$ 12')).toBe('0,12')
  })

  it('empties back to nothing, so the placeholder returns', () => {
    expect(digitsToInput('')).toBe('')
    expect(digitsToInput('abc')).toBe('')
  })

  /** Leading zeros are what a backspace leaves behind; they must not accumulate. */
  it('drops leading zeros', () => {
    expect(digitsToInput('0005')).toBe('0,05')
    expect(digitsToInput('000')).toBe('0,00')
  })

  it('stops at what the field can hold', () => {
    expect(digitsToInput('99999999999999')).toBe('999.999.999,99')
  })
})
