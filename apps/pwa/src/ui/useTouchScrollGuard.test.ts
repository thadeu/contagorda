import { describe, expect, it } from 'vitest'
import { scrollAllowedFrom } from './useTouchScrollGuard'

/**
 * jsdom gives every element a size of zero, so both measurements are set
 * directly. What is under test is the decision, not the layout behind it.
 */
function scroller({ scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  const node = document.createElement('div')

  Object.defineProperty(node, 'scrollHeight', { value: scrollHeight })
  Object.defineProperty(node, 'clientHeight', { value: clientHeight })

  return node
}

describe('scrollAllowedFrom', () => {
  it('allows a drag on content that overflows', () => {
    const node = scroller({ scrollHeight: 900, clientHeight: 300 })
    const row = node.appendChild(document.createElement('p'))

    expect(scrollAllowedFrom(row, node)).toBe(true)
  })

  it('blocks a drag on content that fits, which has nothing to scroll', () => {
    const node = scroller({ scrollHeight: 300, clientHeight: 300 })
    const row = node.appendChild(document.createElement('p'))

    expect(scrollAllowedFrom(row, node)).toBe(false)
  })

  it('blocks the drag handle and the backdrop, which sit outside the scroller', () => {
    const node = scroller({ scrollHeight: 900, clientHeight: 300 })
    const handle = document.createElement('header')

    expect(scrollAllowedFrom(handle, node)).toBe(false)
  })

  it('blocks before the scroller exists', () => {
    expect(scrollAllowedFrom(document.createElement('p'), null)).toBe(false)
  })
})
