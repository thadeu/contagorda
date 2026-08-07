import { beforeEach, describe, expect, it } from 'vitest'
import { forgetMonthOnColdStart } from './coldStart'

function at(url: string) {
  history.replaceState(null, '', url)
}

beforeEach(() => {
  sessionStorage.clear()
  at('/stats')
})

describe('forgetMonthOnColdStart', () => {
  it('drops a remembered month when the app is opened', () => {
    at('/stats?month=2027-03')

    forgetMonthOnColdStart()

    expect(new URL(location.href).searchParams.has('month')).toBe(false)
  })

  /**
   * The system discarding and restoring the view is not the person opening the
   * app, and coming back to a different month than the one you left is the app
   * losing your place.
   */
  it('keeps it when the page is reloaded inside the same session', () => {
    forgetMonthOnColdStart()
    at('/stats?month=2027-03')

    forgetMonthOnColdStart()

    expect(new URL(location.href).searchParams.get('month')).toBe('2027-03')
  })

  it('leaves everything else in the query alone', () => {
    at('/stats?month=2027-03&category=abc')

    forgetMonthOnColdStart()

    expect(new URL(location.href).searchParams.get('category')).toBe('abc')
  })

  it('does nothing when there was no month to forget', () => {
    forgetMonthOnColdStart()

    expect(location.pathname).toBe('/stats')
  })
})
