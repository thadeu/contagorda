import { useEffect } from 'react'

/**
 * How many overlays are currently open.
 *
 * Counted rather than flagged, because sheets nest: accounts opens over the
 * month, and the form opens over accounts. With a flag, the inner one closing
 * unlocks the page while the outer is still covering it — the list behind starts
 * scrolling under a sheet that never went away. The lock belongs to the last one
 * standing, not the first to leave.
 */
let open = 0

/**
 * Freezes what is behind an overlay.
 *
 * The app scrolls inside a container rather than the document, so this only has
 * to mark the page — CSS stops that container from scrolling, holds the document
 * still, and hides anything that floats. Nothing is repositioned, which means
 * there is no scroll offset to save and restore, and closing a sheet cannot jump
 * the list back to the top.
 *
 * The earlier version pinned the body with `position: fixed`, which is what the
 * document-scrolling layout required and where both of those bugs came from.
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    open += 1
    document.documentElement.dataset.overlayOpen = 'true'

    return () => {
      open -= 1

      if (open === 0) {
        delete document.documentElement.dataset.overlayOpen
      }
    }
  }, [])
}
