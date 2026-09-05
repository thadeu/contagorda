import { useEffect, useState } from 'react'

/**
 * How far the software keyboard reaches into the layout.
 *
 * On iOS the keyboard does not resize the page. It covers it, and the only
 * thing that changes is the visual viewport — so a bar pinned to the bottom of
 * the layout is pinned to a bottom nobody can see. Reading the visual viewport
 * and lifting the bar by the difference keeps it just above the keys, which is
 * where the field being typed into has to be.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) return

    function measure() {
      if (!viewport) return

      const covered = window.innerHeight - viewport.height - viewport.offsetTop

      setInset(Math.max(0, Math.round(covered)))
    }

    viewport.addEventListener('resize', measure)
    viewport.addEventListener('scroll', measure)

    return () => {
      viewport.removeEventListener('resize', measure)
      viewport.removeEventListener('scroll', measure)
    }
  }, [])

  return inset
}
