import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useDragLock } from './useDragLock'

function locked() {
  return document.documentElement.dataset.sheetDragging === 'true'
}

afterEach(() => {
  delete document.documentElement.dataset.sheetDragging
})

describe('useDragLock', () => {
  it('holds from the moment a finger lands, before any movement', () => {
    const { result } = renderHook(() => useDragLock())

    expect(locked()).toBe(false)

    result.current.start()

    expect(locked()).toBe(true)
  })

  it('releases when the finger lifts', () => {
    const { result } = renderHook(() => useDragLock())

    result.current.start()
    result.current.end()

    expect(locked()).toBe(false)
  })

  /**
   * The case that matters. A sheet closing mid-drag never receives the end of
   * the gesture, and a lock left behind would make the whole app unscrollable
   * with nothing on screen to explain why.
   */
  it('releases when the sheet goes away mid-drag', () => {
    const { result, unmount } = renderHook(() => useDragLock())

    result.current.start()
    unmount()

    expect(locked()).toBe(false)
  })
})
