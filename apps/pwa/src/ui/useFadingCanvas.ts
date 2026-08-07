import { useEffect } from 'react'

/** How far the page has to travel before the colour is gone. */
const OVER = 180

/** And before the list has taken the full width of the screen. */
const WIDEN = 260

/**
 * The screen's colour gives way as the list comes up.
 *
 * The gradient is the top of the page announcing itself, and it has said what it
 * has to say by the time somebody is reading rows. Holding it there while the
 * content scrolls over it makes two claims at once — that this is a coloured
 * screen, and that it is a list — and the second is the one they are acting on.
 *
 * It is tied to distance, not to direction. Fading on the way up and back on the
 * way down sounds livelier and is worse: the colour would depend on how someone
 * got somewhere rather than on where they are, so the same position would look
 * two ways. Anchored to `scrollTop`, the top of the list is always blue and
 * three hundred pixels down is always white.
 *
 * One custom property on the document, read by everything that paints a canvas —
 * the gradient, the strip behind the status bar and the page under both — so the
 * three fade as one surface rather than as three that agree most of the time.
 *
 * The list widens on the same signal, over a longer distance. It is the other
 * half of the same idea: the top of the page is a screen with things arranged on
 * it, and further down it is a list — so the card that held the rows lets go of
 * its margins and its corners, and the rows end up meeting the edges of the
 * phone the way rows in a list app do. Two numbers rather than one because the
 * colour should be gone before the shape has finished changing; finishing
 * together makes it read as one animation with two parts, which is exactly what
 * a scroll is not.
 *
 * It stops listening while an overlay is up. A covered page has no meaningful
 * scroll position: locking it moves the scroller, and unlocking moves it back,
 * and both arrive here as gestures nobody made — the list would fold itself back
 * into a card, or the colour return, behind a sheet, and then change again on
 * the way out. What someone left on screen is what they should find when the
 * sheet closes.
 *
 * Written straight to the style attribute and never into React state. This runs
 * on every frame of a scroll, and a re-render per frame to change one number the
 * compositor could have handled is the difference between a screen that follows
 * a finger and one that trails it.
 */
export function useFadingCanvas(): void {
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('.app-scroll')

    if (!scroller) return

    const root = document.documentElement
    let frame = 0

    function measure() {
      frame = 0

      if (root.dataset.overlayOpen === 'true') return

      const travelled = Math.max(scroller!.scrollTop, 0)

      root.style.setProperty('--canvas-fade', String(Math.max(1 - travelled / OVER, 0)))
      root.style.setProperty('--list-expand', String(Math.min(travelled / WIDEN, 1)))
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      root.style.removeProperty('--canvas-fade')
      root.style.removeProperty('--list-expand')
    }
  }, [])
}
