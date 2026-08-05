import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useBodyScrollLock } from './useBodyScrollLock'

interface BottomSheetProps {
  title: string
  subtitle?: string
  onClose: () => void
  /**
   * Whether pulling up opens a taller detent.
   *
   * Only worth it when there is more to see — a long list. A sheet holding three
   * actions that grows to fill the screen is empty space pretending to be
   * content, and the gesture teaches nothing because nothing changes.
   */
  expandable?: boolean
  children: ReactNode
}

/** Far enough that a scroll gesture does not trigger a detent by accident. */
const THRESHOLD = 70

/** How far an expandable panel rubber-bands upward, so pulling up answers. */
const PULL_LIMIT = 48

/**
 * Actions come to the thumb rather than the thumb going to them.
 *
 * The panel follows the finger while dragging — direct manipulation, not
 * animation — and only the release travels. Pulling down closes; on an
 * expandable sheet it steps back to compact first, because going from full
 * height to dismissed in one gesture would throw away a list someone had just
 * opened up to read.
 */
export function BottomSheet({
  title,
  subtitle,
  onClose,
  expandable = false,
  children,
}: BottomSheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)

  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  useBodyScrollLock()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    panel.current?.focus()

    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleTouchStart(event: React.TouchEvent) {
    startY.current = event.touches[0].clientY
    setDragging(true)
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    const delta = event.touches[0].clientY - startY.current

    if (delta > 0) {
      setOffset(delta)

      return
    }

    // A fixed sheet does not answer an upward pull, so it does not invite one.
    setOffset(expandable ? Math.max(delta, -PULL_LIMIT) : 0)
  }

  function handleTouchEnd() {
    if (offset > THRESHOLD) {
      if (expandable && expanded) {
        setExpanded(false)
      } else {
        onClose()
      }
    } else if (expandable && offset < -THRESHOLD / 2) {
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
