import { useRef, useState, type ReactNode } from 'react'
import { useEnter } from './useEnter'

interface NoticeProps {
  /** Marks it as something that went wrong rather than something that happened. */
  role?: 'status' | 'alert'
  /**
   * Called when it is flicked away. Left out when there is nothing behind the
   * notice — an error fallback that can be swiped off leaves a blank screen.
   */
  onDismiss?: () => void
  children: ReactNode
}

/** Far enough that a tap on the card cannot throw it away. */
const THRESHOLD = 40

/** How far it gives when pulled the wrong way, so the resistance is felt. */
const RUBBER = 12

/**
 * The chrome of a system notification, borrowed.
 *
 * It comes down from the top and stops clear of the status bar, which is where
 * the platform puts anything that wants to be noticed without being answered.
 * Everything about the shape is doing that job: the wide corner, the translucent
 * material that lets the screen show through, the hairline that separates it
 * from a light background, and a shadow that is broad and faint rather than
 * tight and dark — a card resting a few millimetres above the page, not a box
 * stuck onto it.
 *
 * It is flicked away upwards, back where it came from. Dismissal follows the
 * finger and only commits on release, so a flick that changes its mind lands
 * back in place instead of vanishing. Pulling down gives a little and stops:
 * there is nothing below it to reveal, and a notice that stretches toward the
 * content is inviting a gesture that does nothing.
 *
 * Two things share it, and they should look alike: an error and an undo are both
 * the app reporting something it just did.
 */
export function Notice({ role = 'status', onDismiss, children }: NoticeProps) {
  const entered = useEnter()
  const startY = useRef<number | null>(null)

  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  function handleTouchStart(event: React.TouchEvent) {
    if (!onDismiss) return

    startY.current = event.touches[0].clientY
    setDragging(true)
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    const travelled = event.touches[0].clientY - startY.current

    setOffset(travelled < 0 ? travelled : Math.min(travelled / 3, RUBBER))
  }

  function handleTouchEnd() {
    if (offset < -THRESHOLD) {
      onDismiss?.()
    }

    setOffset(0)
    setDragging(false)
    startY.current = null
  }

  return (
    <div
      role={role}
      data-dragging={dragging}
      style={{ transform: entered ? `translateY(${offset}px)` : 'translateY(-140%)' }}
      className="sheet-snap pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`pointer-events-auto mx-auto max-w-md rounded-[1.375rem] border border-white/8 bg-overlay/85 p-4 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${
          onDismiss ? 'touch-none' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
