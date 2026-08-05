import { useEffect, useRef, useState, type ReactNode } from 'react'

interface BottomSheetProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/** Far enough that a scroll gesture does not trigger a detent by accident. */
const THRESHOLD = 70

/** How far the panel rubber-bands upward, so pulling up answers immediately. */
const PULL_LIMIT = 48

/**
 * Two detents, the way a native sheet behaves.
 *
 * Pulling up expands to full height; pulling down steps back to compact, and
 * pulling down again closes. Going straight from full height to dismissed on
 * one gesture would throw away a list someone had just opened up to read.
 *
 * The panel follows the finger while dragging — direct manipulation, not
 * animation — and only the release travels.
 */
export function BottomSheet({ title, subtitle, onClose, children }: BottomSheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)

  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    panel.current?.focus()

    // Locking the body keeps the list behind from scrolling under the sheet,
    // which on iOS otherwise drags the whole page around.
    const previous = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  function handleTouchStart(event: React.TouchEvent) {
    startY.current = event.touches[0].clientY
    setDragging(true)
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    const delta = event.touches[0].clientY - startY.current

    setOffset(delta > 0 ? delta : Math.max(delta, -PULL_LIMIT))
  }

  function handleTouchEnd() {
    if (offset > THRESHOLD) {
      if (expanded) {
        setExpanded(false)
      } else {
        onClose()
      }
    } else if (offset < -THRESHOLD / 2) {
      setExpanded(true)
    }

    setOffset(0)
    setDragging(false)
    startY.current = null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-dragging={dragging}
        style={{ transform: `translateY(${offset}px)` }}
        className={`sheet-snap relative mx-2 mb-2 flex w-full max-w-md flex-col rounded-card bg-surface p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] outline-none ${
          expanded ? 'h-[92vh]' : 'max-h-[75vh]'
        }`}
      >
        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="shrink-0 px-3 pt-2 pb-4 select-none"
        >
          <div className="flex justify-center pb-3" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>

          <p className="truncate text-base font-semibold text-ink">{title}</p>
          {subtitle && <p className="truncate pt-0.5 text-sm text-muted">{subtitle}</p>}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}

interface SheetActionProps {
  onClick: () => void
  danger?: boolean
  className?: string
  children: ReactNode
}

export function SheetAction({
  onClick,
  danger = false,
  className = '',
  children,
}: SheetActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-13 rounded-control px-4 text-[0.9375rem] font-medium ${
        danger ? 'bg-out/10 text-out' : 'bg-sunken text-ink'
      } ${className}`}
    >
      {children}
    </button>
  )
}
