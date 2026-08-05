import { useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from './icons'
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
        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="shrink-0 px-4 pt-2 pb-1 select-none"
        >
          <div className="flex justify-center pb-3" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-muted"
            >
              <CloseIcon className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div ref={content} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
