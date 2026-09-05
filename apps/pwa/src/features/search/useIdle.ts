import { useEffect, useState, type RefObject } from 'react'

/**
 * True once the scroller has held still for a while.
 *
 * A search bar with nothing typed in it is a promise, not a tool, and a promise
 * does not need to sit over the last row of the list while someone reads. So
 * it waits out a pause and steps aside; the first scroll after that wakes it,
 * and `useHideOnScroll` then decides which way it goes.
 *
 * `armed` is the caller saying the bar is idle-able at all — off while the
 * field has focus or holds a term, when the bar is the thing in use.
 */
export function useIdle(ref: RefObject<HTMLElement | null>, armed: boolean, delayMs: number): boolean {
  const [idle, setIdle] = useState(false)

  // Disarming resets the clock, so the bar comes back awake after a cancel
  // rather than vanishing on the spot because it had been idle before.
  if (!armed && idle) setIdle(false)

  useEffect(() => {
    if (!armed) return

    const element = ref.current
    let timer = setTimeout(() => setIdle(true), delayMs)

    function onScroll() {
      clearTimeout(timer)
      setIdle(false)
      timer = setTimeout(() => setIdle(true), delayMs)
    }

    element?.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      element?.removeEventListener('scroll', onScroll)
    }
  }, [ref, armed, delayMs])

  return idle
}
