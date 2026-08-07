import { useRef, useState, type ReactNode } from 'react'
import { useDragLock } from './useDragLock'
import { useEnter } from './useEnter'

interface DockedSheetProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Stays under the handle while the list moves. For controls over the list. */
  toolbar?: ReactNode
  children: ReactNode
}

/** Where it rests, as a share of the screen. */
const COLLAPSED = 38
const EXPANDED = 85

/** Far enough that reading the list cannot resize it by accident. */
const THRESHOLD = 60

/**
 * A sheet that opens with the screen and never closes.
 *
 * It sits over the page rather than beside it. Splitting the height into two
 * blocks made the screen read as two screens stacked, and the chart above it
 * lost the space it needs to be a chart; over the page, what is behind is a
 * whole screen with a panel resting on it.
 *
 * It reaches the bottom edge, always. Anchored to the bottom of the frame rather
 * than sized to a share of it, so a strip of page can never appear underneath.
 *
 * It starts small. The chart is why the screen exists, and the list is what you
 * pull up when a figure raises a question — opening half-covered answers a
 * question nobody has asked yet.
 *
 * The panel follows the finger. Deciding only on release means a drag where
 * nothing happens and then everything happens at once: the gesture reads as
 * ignored, and the jump at the end reads as a bug. The height is driven live,
 * and `clamp` holds it between the two detents so pulling past either end stops
 * instead of overshooting and springing back.
 *
 * `touch-action` is what makes that work at all: `none` on the bar itself, and
 * `pan-x` on the toolbar, which hands horizontal panning to the browser and
 * leaves every vertical gesture to us. Without it the two fight over the same
 * finger.
 *
 * The grab area is the whole top of the sheet — the bar and the toolbar under
 * it — rather than the four-pixel line that is drawn. A handle sized to what it
 * looks like is a handle sized for a cursor, and there is no cursor here. What
 * is drawn stays small because it is a hint, not a target.
 *
 * It has no backdrop, no dismissal and no scroll lock, because it is not an
 * overlay — what is above it stays usable while the list is read. Pulling it up
 * trades the chart for more rows and pulling it down gives the chart back; there
 * is no state where it is gone, so nothing has to be reopened.
 *
 * On a white page it is separated by a line rather than by a tone. The light
 * theme puts the panel and the page on the same white — there is nothing above
 * white to raise a surface to — so the edge does the work the step in colour
 * does everywhere else. In the dark theme the same line all but disappears
 * against the two colours it sits between, which is the right amount of nothing.
 *
 * It sits on a surface, not on the overlay colour. An overlay is darker than the
 * page because it is covering it; this one is lighter, because it is the raised
 * half of a screen whose background was dropped to let it rise. Same words,
 * opposite direction, which is why they are different tokens.
 *
 * Which is why it is a separate component from `BottomSheet`. That one exists to
 * interrupt, and every part of it — the scrim, the lock, dismissing by tapping
 * away — is about the page behind being unavailable. Sharing the two would mean
 * a prop for each of those, all set the opposite way here.
 */
export function DockedSheet({ expanded, onExpandedChange, toolbar, children }: DockedSheetProps) {
  const startY = useRef<number | null>(null)
  const startX = useRef(0)
  const axis = useRef<'none' | 'vertical' | 'horizontal'>('none')
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const base = expanded ? EXPANDED : COLLAPSED
  const lock = useDragLock()
  const entered = useEnter()

  function handleTouchStart(event: React.TouchEvent) {
    event.stopPropagation()

    startY.current = event.touches[0].clientY
    startX.current = event.touches[0].clientX
    axis.current = 'none'
    setDragging(true)
    lock.start()
  }

  /**
   * The grab area covers the toolbar too, so the same finger could be scrolling
   * the chips sideways or pulling the sheet up. The first few pixels decide
   * which, and the answer holds for the rest of the gesture — re-deciding
   * mid-drag is how a sheet jumps while someone is reading a row of filters.
   */
  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    event.stopPropagation()

    const travelledY = startY.current - event.touches[0].clientY
    const travelledX = event.touches[0].clientX - startX.current

    if (axis.current === 'none' && Math.abs(travelledY) + Math.abs(travelledX) > 6) {
      axis.current = Math.abs(travelledY) > Math.abs(travelledX) ? 'vertical' : 'horizontal'
    }

    if (axis.current !== 'vertical') return

    setOffset(travelledY)
  }

  function handleTouchEnd(event: React.TouchEvent) {
    event.stopPropagation()

    axis.current = 'none'

    if (offset > THRESHOLD) onExpandedChange(true)

    if (offset < -THRESHOLD) onExpandedChange(false)

    setOffset(0)
    setDragging(false)
    startY.current = null
    lock.end()
  }

  return (
    <section
      data-dragging={dragging}
      style={{
        height: `clamp(${COLLAPSED}%, calc(${base}% + ${offset}px), ${EXPANDED}%)`,
        transform: entered ? 'translateY(0)' : 'translateY(100%)',
      }}
      className="sheet-snap absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-card border-t border-line bg-surface shadow-[0_-6px_18px_-14px_rgba(0,0,0,0.28)]"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="shrink-0 select-none"
      >
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          aria-label={expanded ? 'Encolher a lista' : 'Expandir a lista'}
          aria-expanded={expanded}
          className="flex w-full touch-none justify-center py-4"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-ink/30" />
        </button>

        {toolbar}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {children}
      </div>
    </section>
  )
}
