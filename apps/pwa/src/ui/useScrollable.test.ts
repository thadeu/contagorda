import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { useScrollable } from './useScrollable'

function scroller({ scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  const node = document.createElement('div')

  Object.defineProperty(node, 'scrollHeight', { value: scrollHeight })
  Object.defineProperty(node, 'clientHeight', { value: clientHeight })

  return node
}

describe('useScrollable', () => {
  it('marks a scroller that has somewhere to go', () => {
    const ref = createRef<HTMLElement>()

    // Assigning the ref the way React would, before the effect runs.
    ref.current = scroller({ scrollHeight: 900, clientHeight: 300 })

    renderHook(() => useScrollable(ref))

    expect(ref.current?.dataset.scrollable).toBe('true')
  })

  /**
   * The false case is the one that matters: it is what turns touch off, and a
   * gesture on a panel with nothing to move is exactly what iOS answers by
   * scrolling the page underneath.
   */
  it('marks one that does not', () => {
    const ref = createRef<HTMLElement>()

    // Assigning the ref the way React would, before the effect runs.
    ref.current = scroller({ scrollHeight: 300, clientHeight: 300 })

    renderHook(() => useScrollable(ref))

    expect(ref.current?.dataset.scrollable).toBe('false')
  })

  it('does nothing when there is no element yet', () => {
    const ref = createRef<HTMLElement>()

    expect(() => renderHook(() => useScrollable(ref))).not.toThrow()
  })
})
