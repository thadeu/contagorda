import { describe, expect, it } from 'vitest'
import { isDrag, scrollAllowed } from './useTouchScrollGuard'

/**
 * jsdom gives every element a size of zero, so the measurements are set
 * directly. What is under test is the decision, not the layout behind it.
 */
function scroller({
  scrollHeight = 900,
  clientHeight = 300,
  scrollTop = 100,
}: Partial<Record<'scrollHeight' | 'clientHeight' | 'scrollTop', number>> = {}) {
  const node = document.createElement('div')

  Object.defineProperty(node, 'scrollHeight', { value: scrollHeight })
  Object.defineProperty(node, 'clientHeight', { value: clientHeight })
  Object.defineProperty(node, 'scrollTop', { value: scrollTop, writable: true })

  return node
}

function inside(node: HTMLElement) {
  return node.appendChild(document.createElement('p'))
}

describe('scrollAllowed', () => {
  it('allows a drag through the middle of content that overflows', () => {
    const node = scroller()

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: 40 })).toBe(true)
    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: -40 })).toBe(true)
  })

  it('blocks a drag on content that fits, which has nothing to scroll', () => {
    const node = scroller({ scrollHeight: 300, clientHeight: 300 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: 40 })).toBe(false)
  })

  it('blocks the drag handle and the backdrop, which sit outside the scroller', () => {
    const node = scroller()

    expect(
      scrollAllowed({ target: document.createElement('header'), scroller: node, travelled: 40 }),
    ).toBe(false)
  })

  it('lets a tap through, so the click it becomes still arrives', () => {
    const node = scroller({ scrollHeight: 300, clientHeight: 300 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: 3 })).toBe(true)
  })

  /**
   * The reported bug: a form inside a modal scrolls to its top, the finger keeps
   * pulling down, and iOS gives the rest of the gesture to the page behind.
   */
  it('blocks pulling down once the scroller is already at the top', () => {
    const node = scroller({ scrollTop: 0 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: 40 })).toBe(false)
  })

  it('still allows pulling up from the top', () => {
    const node = scroller({ scrollTop: 0 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: -40 })).toBe(true)
  })

  it('blocks pulling up once the scroller is already at the bottom', () => {
    const node = scroller({ scrollTop: 600 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: -40 })).toBe(false)
  })

  it('still allows pulling down from the bottom', () => {
    const node = scroller({ scrollTop: 600 })

    expect(scrollAllowed({ target: inside(node), scroller: node, travelled: 40 })).toBe(true)
  })

  it('blocks before the scroller exists', () => {
    expect(
      scrollAllowed({ target: document.createElement('p'), scroller: null, travelled: 40 }),
    ).toBe(false)
  })
})

describe('isDrag', () => {
  it('treats the wobble of a tap as a tap', () => {
    expect(isDrag(0)).toBe(false)
    expect(isDrag(3)).toBe(false)
    expect(isDrag(-6)).toBe(false)
  })

  it('treats a real pull as a drag, in either direction', () => {
    expect(isDrag(40)).toBe(true)
    expect(isDrag(-40)).toBe(true)
  })
})
