import { useEffect, type RefObject } from 'react'

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

/**
 * Stops a drag inside an overlay from reaching the page.
 *
 * The listener has to be native and non-passive. React registers `touchmove` on
 * the root as passive, and a passive listener's `preventDefault` is ignored by
 * the browser without an error — so the identical call written as an
 * `onTouchMove` prop looks right, runs, and does nothing.
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

    function block(event: TouchEvent) {
      if (scrollAllowedFrom(event.target as Node | null, scroller.current)) {
        return
      }

      event.preventDefault()
    }

    node.addEventListener('touchmove', block, { passive: false })

    return () => node.removeEventListener('touchmove', block)
  }, [overlay, scroller])
}
