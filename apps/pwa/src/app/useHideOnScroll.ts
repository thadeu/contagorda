import { useEffect, useRef, useState, type RefObject } from 'react'

/** Ignores the jitter a finger produces while the list is settling. */
const NOISE = 10

/** Above this, the bar has nothing to get out of the way of yet. */
const FLOOR = 96

/**
 * Hides on the way down, returns on the way up.
 *
 * Scrolling down means reading, and the bar is covering the last rows of what
 * is being read. Scrolling up means looking for something — usually navigation
 * — so it comes back before it is asked for.
 *
 * Listens to the element rather than the window: the app scrolls inside a
 * container, so the document never moves.
 */
export function useHideOnScroll(ref: RefObject<HTMLElement | null>): boolean {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    function onScroll() {
      const y = Math.max(0, element?.scrollTop ?? 0)
      const delta = y - lastY.current

      if (Math.abs(delta) < NOISE) return

      setHidden(delta > 0 && y > FLOOR)
      lastY.current = y
    }

    element.addEventListener('scroll', onScroll, { passive: true })

    return () => element.removeEventListener('scroll', onScroll)
  }, [ref])

  return hidden
}
