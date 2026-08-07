import { useEffect, useRef, useState } from 'react'

/** Travel before the bar gives way, and before it comes back. */
const AWAY = 24
const BACK = 6

/** Close enough to the top that the bar belongs on screen whatever the finger did. */
const TOP = 8

/**
 * A bar that gets out of the way going down and returns going up.
 *
 * The direction is the whole idea. Reading is downward, and someone reading
 * wants the screen; reaching for a control is upward, and the bar has to be
 * there when the finger arrives rather than after another gesture to fetch it.
 * Hiding on a timer, or on distance alone, gets the second half wrong.
 *
 * The two thresholds are deliberately unequal. Leaving costs more travel than
 * returning, because a bar that flickers at every wobble of a thumb is worse
 * than one that stays a moment too long — and the wobble is what a real hand
 * does while it reads. Symmetric thresholds are how this effect ends up feeling
 * nervous.
 *
 * Travel accumulates in one direction and resets when the finger turns, so the
 * distance is measured from the turn rather than from wherever the last event
 * happened to land. Comparing single events would let one stray pixel undo a
 * deliberate scroll.
 *
 * Near the top the bar is always shown. Rubber-band overscroll on iOS reports
 * movement in both directions around zero, and the state that comes out of that
 * is a coin flip; the top of a list is also where the bar is most likely to be
 * wanted, so the answer costs nothing.
 */
export function useHideOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const scroller = ref.current

    if (!scroller) return

    let last = scroller.scrollTop
    let travelled = 0

    function onScroll() {
      if (!scroller) return

      const top = Math.max(scroller.scrollTop, 0)
      const step = top - last

      last = top

      if (top <= TOP) {
        travelled = 0
        setHidden(false)

        return
      }

      travelled = Math.sign(step) === Math.sign(travelled) ? travelled + step : step

      if (travelled > AWAY) setHidden(true)

      if (travelled < -BACK) setHidden(false)
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })

    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  return { ref, hidden }
}
