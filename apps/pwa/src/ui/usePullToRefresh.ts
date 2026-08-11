import { useEffect, useRef, useState, type RefObject } from 'react'

/** How far the finger has to pull before letting go means anything. */
const THRESHOLD = 64

/** Where the content waits while the answer is on its way. */
const REST = 48

/** The pull cannot go further than this, however hard it is pulled. */
const MAX = 96

/**
 * How much of the finger's travel the content follows.
 *
 * Half. A surface that tracks a finger exactly at the end of its scroll reads as
 * broken rather than elastic — every phone answers a pull past the end with
 * something that resists, and the resistance is the part that says "this is the
 * end of the list", not the movement.
 */
const FOLLOW = 0.5

/** Below this the gesture is a wobble on the way to a tap. */
const SLOP = 6

/**
 * Pull the top of a list down to ask for it again.
 *
 * The gesture only exists at the top: it starts if the scroller is already at
 * zero when the finger lands, and never mid-list — a list scrolled to its top by
 * the same gesture that then pulls further is one continuous movement to the
 * person making it, but the first half belongs to the browser, and taking the
 * second half over halfway through is what makes a refresh fire on a scroll
 * nobody meant as one.
 *
 * `touchmove` is cancelled while the pull is on, which is also what stops iOS
 * from rubber-banding underneath: two surfaces moving from one finger, one of
 * them the browser's. The listener has to be native and non-passive for that —
 * React registers its own as passive, and `preventDefault` in a passive listener
 * is ignored without an error, so the identical code written as `onTouchMove`
 * runs and does nothing.
 *
 * The distance is written straight to the element's style. This runs on every
 * frame of a drag, and a re-render per frame to move one box is the difference
 * between content that follows a finger and content that trails it. Only
 * `refreshing` is state — it changes twice per gesture, and something has to
 * hold the content open while the request is in flight.
 */
export function usePullToRefresh(
  content: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<unknown>,
): { refreshing: boolean } {
  const [refreshing, setRefreshing] = useState(false)
  const refresh = useRef(onRefresh)

  useEffect(() => {
    refresh.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('.app-scroll')

    if (!scroller) return

    let startY: number | null = null
    let distance = 0

    function place(travelled: number, settling: boolean) {
      const node = content.current

      if (!node) return

      node.style.transition = settling ? 'transform 220ms ease-out' : ''
      node.style.transform = travelled === 0 ? '' : `translateY(${travelled}px)`
      node.style.setProperty('--pull', String(Math.min(travelled / THRESHOLD, 1)))
    }

    function start(event: TouchEvent) {
      // A covered page is not being read. Locking the scroller for a sheet
      // moves it, and unlocking moves it back, and both arrive here as
      // gestures nobody made.
      if (document.documentElement.dataset.overlayOpen === 'true') return

      if (scroller!.scrollTop > 0) return

      startY = event.touches[0]?.clientY ?? null
      distance = 0
    }

    function move(event: TouchEvent) {
      if (startY === null) return

      const travelled = (event.touches[0]?.clientY ?? startY) - startY

      // Upward, or the list moved under the finger after all: the browser gets
      // the gesture back, and whatever was showing goes away.
      if (travelled < SLOP || scroller!.scrollTop > 0) {
        if (distance > 0) place(0, true)

        startY = null
        distance = 0

        return
      }

      if (event.cancelable) event.preventDefault()

      distance = Math.min(travelled * FOLLOW, MAX)

      place(distance, false)
    }

    function end() {
      if (startY === null) return

      const pulled = distance

      startY = null
      distance = 0

      if (pulled < THRESHOLD) {
        place(0, true)

        return
      }

      // Held open until the answer arrives, so the gesture has somewhere to
      // land. Snapping shut the instant a finger lifts reads as a refresh that
      // did not happen, whatever the list does a moment later.
      setRefreshing(true)
      place(REST, true)

      refresh.current().finally(() => {
        setRefreshing(false)
        place(0, true)
      })
    }

    scroller.addEventListener('touchstart', start, { passive: true })
    scroller.addEventListener('touchmove', move, { passive: false })
    scroller.addEventListener('touchend', end)
    scroller.addEventListener('touchcancel', end)

    return () => {
      scroller.removeEventListener('touchstart', start)
      scroller.removeEventListener('touchmove', move)
      scroller.removeEventListener('touchend', end)
      scroller.removeEventListener('touchcancel', end)
      place(0, false)
    }
  }, [content])

  return { refreshing }
}
