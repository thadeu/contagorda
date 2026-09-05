import { useLayoutEffect, useRef, useState } from 'react'
import { useHideOnScroll } from '@/app/useHideOnScroll'
import { FramePortal } from '@/ui/Portal'
import { SearchField } from './SearchField'
import { useKeyboardInset } from './useKeyboardInset'

interface SearchDockProps {
  term: string
  onTermChange: (term: string) => void
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
 * Portalled into the frame rather than the scroller, so it is pinned to the
 * bottom of the screen and not to the bottom of the page.
 */
export function SearchDock({ term, onTermChange }: SearchDockProps) {
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    scroller.current = document.querySelector<HTMLElement>('.app-scroll')
  }, [])

  const hidden = useHideOnScroll(scroller)
  const keyboard = useKeyboardInset()
  const searching = focused || term !== ''

  function cancel() {
    onTermChange('')
    setFocused(false)
    input.current?.blur()
  }

  return (
    <FramePortal>
      <div
        style={{ bottom: keyboard }}
        className={`absolute inset-x-0 z-20 px-3.5 pt-3 pb-[max(0.25rem,calc(env(safe-area-inset-bottom)-1rem))] transition-transform duration-300 ease-out ${
          hidden && !focused ? 'translate-y-full' : 'translate-y-0'
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
