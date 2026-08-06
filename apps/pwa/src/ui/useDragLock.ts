import { useCallback, useEffect, useRef } from 'react'

const FLAG = 'sheetDragging'

/**
 * Freezes whatever is behind a sheet the moment a finger lands on it.
 *
 * The open-state lock already stops the page scrolling while a sheet is up, but
 * it does not stop the browser from deciding, in the first milliseconds of a
 * touch, that this gesture is a scroll and claiming it. By then the drag has
 * lost: the panel stutters, or nothing moves until the finger lifts. Marking the
 * page at `touchstart` — before there is any movement to interpret — settles the
 * question before it is asked.
 *
 * The release is the part that matters. A sheet can close mid-drag, and then no
 * `touchend` ever arrives on an element that no longer exists: the flag would
 * stay, and the app would be left unscrollable with nothing on screen to explain
 * it. Unmounting clears it, so the worst case is a lock that outlives the
 * gesture by one render rather than one that outlives the session.
 */
export function useDragLock(): { start: () => void; end: () => void } {
  const held = useRef(false)

  const end = useCallback(() => {
    held.current = false
    delete document.documentElement.dataset[FLAG]
  }, [])

  const start = useCallback(() => {
    held.current = true
    document.documentElement.dataset[FLAG] = 'true'
  }, [])

  useEffect(() => end, [end])

  return { start, end }
}
