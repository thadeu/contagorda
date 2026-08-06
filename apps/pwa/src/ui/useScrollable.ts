import { useEffect, type RefObject } from 'react'

/**
 * Marks a scroller with whether it currently has anywhere to scroll.
 *
 * The CSS that reads it turns touch off entirely when the answer is no, which is
 * the only thing that stops the page moving behind a sheet on iOS. Cancelling
 * the gesture afterwards does not: a guard has to let the first few pixels
 * through to tell a tap from a drag, and by then Safari has claimed the gesture
 * and stopped listening. `touch-action` is a declaration made before the finger
 * lands, which is the only moment the browser is still asking.
 *
 * Re-measured whenever the content or the box changes, because a sheet that
 * cannot scroll when it opens often can once a list loads underneath it.
 */
export function useScrollable(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = ref.current

    if (!node) return

    function measure() {
      if (!node) return

      node.dataset.scrollable = String(node.scrollHeight > node.clientHeight)
    }

    measure()

    // The measurement is the feature; watching for changes refines it. Guarded
    // because not every environment that renders this has an observer — jsdom
    // does not — and a missing refinement should not take the answer with it.
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)

    observer.observe(node)

    for (const child of node.children) {
      observer.observe(child)
    }

    return () => observer.disconnect()
  }, [ref])
}
