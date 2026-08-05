import { useEffect } from 'react'

/**
 * Freezes what is behind an overlay.
 *
 * The app scrolls inside a container rather than the document, so this only has
 * to mark the page — CSS stops that container from scrolling and hides the tab
 * bar. Nothing is repositioned, which means there is no scroll offset to save
 * and restore, and closing a sheet cannot jump the list back to the top.
 *
 * The earlier version pinned the body with `position: fixed`, which is what the
 * document-scrolling layout required and where both of those bugs came from.
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    document.documentElement.dataset.overlayOpen = 'true'

    return () => {
      delete document.documentElement.dataset.overlayOpen
    }
  }, [])
}
