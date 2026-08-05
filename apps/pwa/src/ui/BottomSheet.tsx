import { useEffect, useRef, useState, type ReactNode } from 'react'

interface BottomSheetProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/** Far enough that a scroll gesture does not dismiss by accident. */
const DISMISS_AT = 90

/**
 * Actions come to the thumb rather than the thumb going to them.
 *
 * The sheet follows the finger while it is being dragged. That is direct
 * manipulation, not an animation — the panel is exactly where the touch put it
 * at every moment, which is why it still feels right with transitions off.
 */
export function BottomSheet({ title, subtitle, onClose, children }: BottomSheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)

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
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    // Downward only. Letting it travel up would peel the sheet off the bottom
    // edge it is anchored to.
    setOffset(Math.max(0, event.touches[0].clientY - startY.current))
  }

  function handleTouchEnd() {
    if (offset > DISMISS_AT) {
      onClose()
    } else {
      setOffset(0)
    }

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
        style={{ transform: `translateY(${offset}px)` }}
        className="relative mx-2 mb-2 w-full max-w-md rounded-card bg-surface p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] outline-none"
      >
        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-3 pt-2 pb-4"
        >
          <div className="flex justify-center pb-3" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>

          <p className="truncate text-base font-semibold text-ink">{title}</p>
          {subtitle && <p className="truncate pt-0.5 text-sm text-muted">{subtitle}</p>}
        </header>

        {children}
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

export function SheetAction({ onClick, danger = false, className = '', children }: SheetActionProps) {
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
