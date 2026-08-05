import { useEffect } from 'react'

type Canvas = 'brand'

/**
 * Paints the document behind a full-screen surface.
 *
 * In a standalone PWA `100dvh` can resolve to less than the physical screen, so
 * anything sized to the viewport leaves a sliver of the page showing along the
 * bottom edge. On a light page under a dark screen that sliver reads as a band
 * — and only in the installed app, which is why it never appears in the
 * browser.
 *
 * Colouring the document to match removes it without inflating the surface past
 * the viewport, which would push a bottom-anchored element off the screen.
 */
export function useDocumentCanvas(canvas: Canvas): void {
  useEffect(() => {
    document.documentElement.dataset.canvas = canvas

    return () => {
      delete document.documentElement.dataset.canvas
    }
  }, [canvas])
}
