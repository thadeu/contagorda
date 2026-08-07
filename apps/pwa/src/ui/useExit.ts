import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * How long a sheet takes to leave. Must match `.sheet-snap` in tokens.css — the
 * transition draws the movement, this decides when the element may be removed,
 * and the two disagreeing means either a stutter at the end or a panel that
 * vanishes mid-slide.
 */
const EXIT_MS = 340

/**
 * Lets a sheet finish leaving before it is taken away.
 *
 * Opening animates because the element is there to animate; closing does not,
 * because the parent unmounts it the moment it decides to. So the request to
 * close is separated from the closing: the sheet marks itself as leaving, plays
 * the same movement in reverse, and only then tells the parent — which is the
 * one thing that makes a dismissal feel like the drag that could have caused it
 * rather than a panel being switched off.
 *
 * The second request is ignored. Tapping the backdrop twice, or dragging away
 * while a close is already running, would otherwise queue a second timer and
 * call the parent again after it has already unmounted.
 */
export function useExit(onClose: () => void): { leaving: boolean; requestClose: () => void } {
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const requestClose = useCallback(() => {
    setLeaving((already) => {
      if (already) return already

      timer.current = window.setTimeout(onClose, EXIT_MS)

      return true
    })
  }, [onClose])

  return { leaving, requestClose }
}
