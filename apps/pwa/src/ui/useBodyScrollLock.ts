import { useEffect } from 'react'

/**
 * Freezes the page behind an overlay.
 *
 * `overflow: hidden` on the body is not enough on iOS — Safari keeps scrolling
 * the page underneath and the sheet drifts with it. Pinning the body with
 * `position: fixed` at its current offset is what actually holds, and the
 * offset has to be restored on the way out or closing the sheet would jump the
 * list back to the top.
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    const { body } = document
    const scrollY = window.scrollY
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    // Lets CSS hide anything that must not sit behind an overlay. The tab bar
    // is a dark pill on the bottom edge, and a 35% backdrop does not hide it —
    // it just dims it into a band under the sheet.
    document.documentElement.dataset.overlayOpen = 'true'

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.width = previous.width
      body.style.overflow = previous.overflow

      delete document.documentElement.dataset.overlayOpen

      window.scrollTo(0, scrollY)
    }
  }, [])
}
