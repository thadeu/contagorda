import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppIcon } from './icons'
import { useBodyScrollLock } from './useBodyScrollLock'
import { useDragLock } from './useDragLock'
import { useScrollable } from './useScrollable'
import { Portal } from './Portal'
import { useEnter } from './useEnter'
import { useTouchScrollGuard } from './useTouchScrollGuard'

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
  /** Controls that belong to the sheet itself, on the title's line. */
  actions?: ReactNode
  /**
   * Sits under the heading and drags with it.
   *
   * For anything that is read rather than tapped. The handle is four pixels of
   * drawn line and the heading is barely more; a sheet whose only grab area is
   * its title asks for precision the gesture does not need, when the whole top
   * of it is doing nothing else.
   */
  grab?: ReactNode
  children: ReactNode
}

/** Far enough that a scroll gesture does not trigger a detent by accident. */
const THRESHOLD = 70

/** The two heights of an expandable sheet, as a share of the viewport. */
const COMPACT = 75
const EXPANDED = 92

/**
 * Actions come to the thumb rather than the thumb going to them.
 *
 * A drag anywhere in here that is not scrolling the sheet's own content is
 * cancelled outright, or iOS spends it on the page underneath and the app
 * appears to travel with the sheet.
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
  actions,
  grab,
  children,
}: BottomSheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)

  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const lock = useDragLock()
  const entered = useEnter()

  useBodyScrollLock()
  useTouchScrollGuard(overlay, content)
  useScrollable(content)

  /**
   * The gesture splits in two. Downward moves the whole panel toward being
   * dismissed; upward grows it, and only when there is a taller detent to grow
   * into. Both are driven live — a pull that stores up its effect until release
   * reads as a sheet that ignored you and then jumped.
   */
  const pulledUp = expandable ? Math.max(-offset, 0) : 0

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    panel.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function handleTouchStart(event: React.TouchEvent) {
    startY.current = event.touches[0].clientY
    setDragging(true)
    lock.start()
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (startY.current === null) return

    const delta = event.touches[0].clientY - startY.current

    // A fixed sheet does not answer an upward pull, so it does not invite one.
    setOffset(delta > 0 || expandable ? delta : 0)
  }

  function handleTouchEnd() {
    if (offset > THRESHOLD) {
      if (expandable && expanded) {
        setExpanded(false)
      } else {
        onClose()
      }
    } else if (expandable && offset < -THRESHOLD) {
      setExpanded(true)
    }

    setOffset(0)
    setDragging(false)
    startY.current = null
    lock.end()
  }

  return (
    <Portal>
      <div ref={overlay} className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className={`fade-in absolute inset-x-0 -inset-y-24 touch-none bg-black/45 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-dragging={dragging}
        style={{
          transform: entered ? `translateY(${Math.max(offset, 0)}px)` : 'translateY(100%)',
          height: expandable
            ? `clamp(${COMPACT}dvh, calc(${expanded ? EXPANDED : COMPACT}dvh + ${pulledUp}px), ${EXPANDED}dvh)`
            : undefined,
        }}
        className={`sheet-snap relative mx-2 mb-2 flex w-full max-w-md flex-col rounded-card bg-overlay p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] outline-none ${
          expandable ? '' : 'max-h-[75dvh]'
        }`}
      >
        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="shrink-0 touch-none px-3 pt-2 pb-3 select-none"
        >
          <div className="flex justify-center pb-3" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-ink/30" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{title}</p>
              {subtitle && <p className="truncate pt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>

          {grab}
        </header>

        <div
          ref={content}
          className="sheet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </div>
      </div>
    </Portal>
  )
}

interface SheetActionCardProps {
  onClick: () => void
  label: string
  icon: AppIcon
  danger?: boolean
}

/**
 * A tall tile carrying a label and its icon.
 *
 * Used where two or three actions sit side by side: at that size the icon is
 * what the eye picks first on the second visit, and a row of text labels forces
 * a read every time. Full-width rows stay for list-shaped choices, where a grid
 * would only stretch one option across the screen.
 */
export function SheetActionCard({ onClick, label, icon: Icon, danger = false }: SheetActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-control px-3 ${
        danger ? 'bg-out/10 text-out' : 'bg-sunken text-ink'
      }`}
    >
      <span className="text-[0.9375rem] font-semibold">{label}</span>
      <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
