import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExit } from './useExit'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useExit', () => {
  it('marks the sheet as leaving at once, so the movement can start', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useExit(onClose))

    act(() => result.current.requestClose())

    expect(result.current.leaving).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })

  /**
   * The parent unmounts the sheet the moment it hears, so it must not hear until
   * the panel has finished leaving — otherwise the element is taken away
   * mid-slide and the close reads as the sheet being switched off.
   */
  it('tells the parent only once the movement is done', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useExit(onClose))

    act(() => result.current.requestClose())
    act(() => vi.advanceTimersByTime(339))

    expect(onClose).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores a second request, which would close the parent twice', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useExit(onClose))

    act(() => result.current.requestClose())
    act(() => result.current.requestClose())
    act(() => vi.runAllTimers())

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not fire after the sheet has gone', () => {
    const onClose = vi.fn()
    const { result, unmount } = renderHook(() => useExit(onClose))

    act(() => result.current.requestClose())
    unmount()
    act(() => vi.runAllTimers())

    expect(onClose).not.toHaveBeenCalled()
  })
})
