import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useBodyScrollLock } from './useBodyScrollLock'

const html = document.documentElement

afterEach(() => {
  delete html.dataset.overlayOpen
})

describe('useBodyScrollLock', () => {
  it('marks the page while a sheet is open', () => {
    const { unmount } = renderHook(() => useBodyScrollLock())

    expect(html.dataset.overlayOpen).toBe('true')

    unmount()

    expect(html.dataset.overlayOpen).toBeUndefined()
  })

  /**
   * Sheets nest three deep here — accounts, then the form, then a confirmation.
   * With a flag rather than a count, the innermost closing would unmark the page
   * while two are still covering it.
   */
  it('stays marked until the last sheet closes', () => {
    const outer = renderHook(() => useBodyScrollLock())
    const inner = renderHook(() => useBodyScrollLock())

    inner.unmount()

    expect(html.dataset.overlayOpen).toBe('true')

    outer.unmount()

    expect(html.dataset.overlayOpen).toBeUndefined()
  })

  /**
   * Neither is touched, and that is the point: both were tried, and both bring
   * the band back along the bottom edge — the page reaches that edge by being
   * taller than the viewport, and freezing or re-anchoring the document takes
   * that away.
   */
  it('changes no layout on the document', () => {
    const { unmount } = renderHook(() => useBodyScrollLock())

    expect(html.style.overflow).toBe('')
    expect(document.body.style.position).toBe('')

    unmount()
  })
})
