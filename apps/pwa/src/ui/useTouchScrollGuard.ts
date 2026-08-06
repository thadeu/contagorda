import { useEffect, type RefObject } from 'react'

/**
 * How far a finger has to travel before it counts as a drag rather than a tap.
 *
 * Nobody holds a finger still. A tap on a button reports a few pixels of
 * movement, and cancelling that gesture is how a button stops responding — the
 * click is synthesised from a touch sequence the page just refused. The page can
 * only travel one safe-area inset in total, so what leaks under this threshold
 * is not visible, and dead buttons are.
 */
const DRAG_SLOP = 10

/** Rounding in scroll measurements; a scroller one pixel short is still at its end. */
const EDGE = 1

export interface Gesture {
  target: Node | null
  scroller: HTMLElement | null
  /** Positive when the finger has moved down the screen. */
  travelled: number
}

/**
 * Whether a drag inside an overlay may be left to the browser.
 *
 * Three ways it may not, and the third is the one that took two attempts.
 *
 * Nothing to scroll: the drag handle, the backdrop, a list short enough to sit
 * still. iOS answers a gesture with nowhere to go by scrolling whatever is
 * underneath — the whole app travelling behind the sheet.
 *
 * Not a drag at all: a tap wobbles a few pixels, and cancelling that gesture is
 * how the click synthesised from it never arrives.
 *
 * And chaining at the boundary: a scroller already at its top, pulled down
 * further, hands the rest of the gesture to the page behind it. That is what
 * makes the screen creep while a modal is open — the form scrolls perfectly, and
 * the moment it runs out the movement is passed on. `overscroll-contain` is
 * supposed to stop this and cannot be relied on for nested scrollers on iOS, so
 * the edges are checked directly.
 */
export function scrollAllowed({ target, scroller, travelled }: Gesture): boolean {
  if (!scroller || !target) return false

  if (!isDrag(travelled)) return true

  if (!scroller.contains(target)) return false

  if (scroller.scrollHeight <= scroller.clientHeight) return false

  const atTop = scroller.scrollTop <= 0
  const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - EDGE

  if (atTop && travelled > 0) return false

  if (atBottom && travelled < 0) return false

  return true
}

/** A gesture is only worth cancelling once it is going somewhere. */
export function isDrag(travelled: number): boolean {
  return Math.abs(travelled) > DRAG_SLOP
}

/**
 * Moves a scroller one pixel off its own boundary before a gesture begins.
 *
 * Sitting exactly at the top or the bottom is what makes iOS hand the gesture to
 * the page behind, and by the time a guard can cancel it the browser has already
 * decided — a drag has to travel a few pixels before it can be told from a tap,
 * and that is enough. A pixel of slack means the scroller always has somewhere
 * to go, so the gesture is never passed on in the first place.
 *
 * Invisible: one pixel, moved before the finger has travelled at all, on an
 * element that is about to scroll anyway.
 */
function nudgeOffTheEdge(node: HTMLElement | null): void {
  if (!node || node.scrollHeight <= node.clientHeight) return

  if (node.scrollTop <= 0) {
    node.scrollTop = 1

    return
  }

  if (node.scrollTop + node.clientHeight >= node.scrollHeight) {
    node.scrollTop = node.scrollHeight - node.clientHeight - 1
  }
}

/**
 * Stops a drag inside an overlay from reaching the page.
 *
 * The listener has to be native and non-passive. React registers `touchmove` on
 * the root as passive, and a passive listener's `preventDefault` is ignored by
 * the browser without an error — so the identical call written as an
 * `onTouchMove` prop looks right, runs, and does nothing.
 */
export function useTouchScrollGuard(
  overlay: RefObject<HTMLElement | null>,
  scroller: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const node = overlay.current

    if (!node) return

    let startY: number | null = null

    function start(event: TouchEvent) {
      startY = event.touches[0]?.clientY ?? null

      nudgeOffTheEdge(scroller.current)
    }

    function block(event: TouchEvent) {
      if (startY === null) return

      const travelled = (event.touches[0]?.clientY ?? startY) - startY

      if (scrollAllowed({ target: event.target as Node | null, scroller: scroller.current, travelled })) {
        return
      }

      event.preventDefault()
    }

    node.addEventListener('touchstart', start, { passive: true })
    node.addEventListener('touchmove', block, { passive: false })

    return () => {
      node.removeEventListener('touchstart', start)
      node.removeEventListener('touchmove', block)
    }
  }, [overlay, scroller])
}
