import { useLayoutEffect, useRef, useState } from 'react'
import { useHideOnScroll } from '@/app/useHideOnScroll'
import { FramePortal } from '@/ui/Portal'
import { SearchField } from './SearchField'
import { useIdle } from './useIdle'
import { useKeyboardInset } from './useKeyboardInset'

/** How long the page has to hold still before an empty bar steps aside. */
const IDLE_MS = 3000

interface SearchDockProps {
  term: string
  onTermChange: (term: string) => void
  /**
   * Keeps the bar in place whatever the scroll or the clock says. For a list
   * too short to be in the way of: two rows leave the bar covering nothing,
   * and a page that short cannot travel far enough to bring it back once it
   * has gone — a control that hides for no visible reason reads as missing.
   */
  pinned?: boolean
}

/**
 * The search bar at the foot of the month view.
 *
 * It narrows the list already on screen, letter by letter, and opens nothing:
 * the month is in memory, so there is no request to wait for and no second
 * screen to come back from. The term lives with the page — `DashboardPage` —
 * because the list is what reads it.
 *
 * It follows the scroll the way the platform's does: gone while reading down,
 * back on the first move up — reading means the last rows are what matters and
 * the bar is covering them. A typed term does not pin it: the list it narrowed
 * is still a list being read. Only the keyboard does, while the field has focus.
 *
 * Empty and untouched, it does not stay either: after a few seconds without a
 * scroll it slides away, since a bar with nothing in it is only covering the
 * list. Any scroll wakes it, and the direction rule above takes over.
 *
 * Portalled into the frame rather than the scroller, so it is pinned to the
 * bottom of the screen and not to the bottom of the page.
 */
export function SearchDock({ term, onTermChange, pinned = false }: SearchDockProps) {
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    scroller.current = document.querySelector<HTMLElement>('.app-scroll')
  }, [])

  const hidden = useHideOnScroll(scroller)
  const keyboard = useKeyboardInset()
  const searching = focused || term !== ''
  const idle = useIdle(scroller, !searching && !pinned, IDLE_MS)
  const away = (hidden || idle) && !focused && !pinned

  function cancel() {
    onTermChange('')
    setFocused(false)
    input.current?.blur()
  }

  return (
    <FramePortal>
      <div
        style={{ bottom: keyboard }}
        className={`absolute inset-x-0 z-20 px-5 pt-3 pb-[max(0.25rem,calc(env(safe-area-inset-bottom)-1rem))] transition-transform duration-300 ease-out ${
          away ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <SearchField
          ref={input}
          value={term}
          open={searching}
          onChange={onTermChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onCancel={cancel}
        />
      </div>
    </FramePortal>
  )
}
