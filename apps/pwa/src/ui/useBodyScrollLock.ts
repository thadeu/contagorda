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
      overflow: body.style.overflow,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.overflow = 'hidden'

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.overflow = previous.overflow

      window.scrollTo(0, scrollY)
    }
  }, [])
}
