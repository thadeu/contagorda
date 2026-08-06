import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnter } from './useEnter'

let frames: FrameRequestCallback[] = []

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)

    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function paint() {
  const pending = frames

  frames = []
  act(() => pending.forEach((callback) => callback(0)))
}

describe('useEnter', () => {
  it('starts false, so the panel has somewhere to move from', () => {
    const { result } = renderHook(() => useEnter())

    expect(result.current).toBe(false)
  })

  /**
   * The frame count is the point. One frame can still land inside the same paint
   * on iOS, and then the panel is simply placed at its destination with no
   * animation — the same failure as not scheduling anything.
   */
  it('is still false after a single frame', () => {
    const { result } = renderHook(() => useEnter())

    paint()

    expect(result.current).toBe(false)
  })

  it('turns true on the second frame', () => {
    const { result } = renderHook(() => useEnter())

    paint()
    paint()

    expect(result.current).toBe(true)
  })
})
