import { useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { NavBar, NavButton } from './NavBar'
import { useBodyScrollLock } from './useBodyScrollLock'
import { useTouchScrollGuard } from './useTouchScrollGuard'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Far enough that scrolling the form cannot dismiss it by accident. */
const THRESHOLD = 90

/**
 * A task presented over the app, not a place you travel to.
 *
 * Creating a transaction is a few seconds of work that ends where it started,
 * and a route says the opposite: it puts the task in the address bar, gives it a
 * back button, and asks the person to navigate their way home. The app stays
 * visible above this panel, which is the whole message — you are still on the
 * month, with something in front of it.
 *
 * The panel bleeds below its own bottom edge. A `position: fixed` box is inset
 * by the safe areas in the installed app, so a panel meant to meet the bottom of
 * the screen stops short of it and the dimmed page shows through as a band. The
 * backdrop solves this for itself with `-inset-y-24`; the panel needs the same,
 * and cannot use a negative inset without moving the content inside it.
 *
 * It is deliberately not `BottomSheet`. That one is a short list of actions, and
 * its detents exist so a long list can be pulled taller. A form has one height:
 * as much as it needs, up to nearly the screen. Sharing a component between the
 * two would mean a prop for every place they disagree.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const overlay = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)

  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  useBodyScrollLock()
  useTouchScrollGuard(overlay, content)

  function handleTouchStart(event: React.TouchEvent) {
    startY.current = event.touches[0].clientY
    setDragging(true)
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    setOffset(Math.max(event.touches[0].clientY - startY.current, 0))
  }

  function handleTouchEnd() {
    if (offset > THRESHOLD) {
      onClose()
    }

    setOffset(0)
    setDragging(false)
    startY.current = null
  }

  return (
    <div ref={overlay} className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-x-0 -inset-y-24 bg-ink/35"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-dragging={dragging}
        style={{ transform: `translateY(${offset}px)` }}
        className="sheet-snap relative flex h-[calc(100%-env(safe-area-inset-top)-2.5rem)] w-full max-w-lg flex-col rounded-t-card bg-surface"
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="shrink-0 select-none"
        >
          <div className="flex justify-center pt-2" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>

          <NavBar
            title={title}
            leading={<NavButton icon={CloseIcon} label="Fechar" onClick={onClose} />}
          />
        </div>

        <div ref={content} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 top-full h-24 bg-surface" />
      </div>
    </div>
  )
}
