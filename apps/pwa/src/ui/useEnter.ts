import { useEffect, useState } from 'react'

/**
 * True from the frame after the element first paints.
 *
 * Panels mount already at their destination as far as the browser is concerned,
 * so a class applied in the same commit produces no transition — there was never
 * a starting value to move from. Waiting a frame gives it one: the panel paints
 * offscreen once, then the change is animated.
 *
 * Two frames, not one. A single `requestAnimationFrame` can still land inside
 * the same paint on iOS, and the animation is skipped exactly as if it had not
 * been scheduled at all — the second frame is what guarantees the first state
 * reached the screen.
 *
 * The movement itself is left to CSS. This decides *when* to move; the
 * compositor decides how, which is what keeps a slide off the main thread while
 * a list of a hundred rows renders behind it.
 */
export function useEnter(): boolean {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true))
    })

    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  return entered
}
