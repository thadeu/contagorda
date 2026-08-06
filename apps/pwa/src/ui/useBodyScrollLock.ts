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
 * Marks the page as covered.
 *
 * It touches no layout at all — no `overflow`, no `position`. Both were tried
 * and both bring the band back along the bottom edge in the installed app: the
 * page reaches that edge by sitting one status-bar height taller than the
 * viewport, and anything that freezes or re-anchors the document takes that
 * away. The trade was real and had no good side.
 *
 * What actually stops the page moving behind a sheet is `touch-action` on the
 * sheet itself, declared before the finger lands — see `useScrollable`. This
 * attribute is only for what CSS still has to say: the page takes the scrim's
 * colour, the app's own scroller stops, anything floating hides.
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
