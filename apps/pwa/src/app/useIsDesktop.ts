import { useSyncExternalStore } from 'react'

/**
 * A wide window driven by a mouse or a trackpad.
 *
 * Width alone is not the test. An iPad held sideways is wider than the
 * breakpoint and is still a touch screen, where the sheets, the drag gestures
 * and the thumb-sized targets are the right answer. `pointer: fine` is what
 * separates the Mac from the tablet.
 */
export const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)'

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY)

  query.addEventListener('change', onChange)

  return () => query.removeEventListener('change', onChange)
}

function snapshot(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
