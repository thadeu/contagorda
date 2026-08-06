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

/**
 * Whether a touch drag on this element should be allowed to scroll.
 *
 * Only one thing inside an overlay has any business scrolling: its own content,
 * and only when there is more of it than fits. Everywhere else — the drag
 * handle, the backdrop, a list short enough to sit still — a drag has nothing to
 * move, and iOS answers by scrolling whatever is underneath instead. That is the
 * whole app travelling behind the sheet.
 */
export function scrollAllowedFrom(target: Node | null, scroller: HTMLElement | null): boolean {
  if (!scroller || !target) return false

  if (!scroller.contains(target)) return false

  return scroller.scrollHeight > scroller.clientHeight
}

/** A gesture is only worth cancelling once it is going somewhere. */
export function isDrag(travelled: number): boolean {
  return Math.abs(travelled) > DRAG_SLOP
}

/**
 * Stops a drag inside an overlay from reaching the page.
 *
 * The listener has to be native and non-passive. React registers `touchmove` on
 * the root as passive, and a passive listener's `preventDefault` is ignored by
 * the browser without an error — so the identical call written as an
 * `onTouchMove` prop looks right, runs, and does nothing.
 *
 * Only drags are cancelled, never taps. Cancelling a gesture the browser was
 * about to turn into a click is how every button inside a sheet quietly stops
 * working, and it only shows up on a real finger — a synthetic click in a test
 * never moves.
 *
 * Boundary chaining, where a scroller already at its end hands the gesture on,
 * is a different problem and belongs to `overscroll-contain` on the scroller.
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
    }

    function block(event: TouchEvent) {
      if (startY === null) return

      if (!isDrag((event.touches[0]?.clientY ?? startY) - startY)) {
        return
      }

      if (scrollAllowedFrom(event.target as Node | null, scroller.current)) {
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
