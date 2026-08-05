import { useEffect, useRef, type ReactNode } from 'react'

interface BottomSheetProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/**
 * Actions come to the thumb rather than the thumb going to them.
 *
 * A row with three affordances on it spends width on controls that are only
 * wanted occasionally; a sheet keeps the row to its content and puts every
 * action within reach of the hand already holding the phone.
 */
export function BottomSheet({ title, subtitle, onClose, children }: BottomSheetProps) {
  const panel = useRef<HTMLDivElement>(null)

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
        className="relative mx-2 mb-2 w-full max-w-md rounded-card bg-surface p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] outline-none"
      >
        <header className="px-3 pt-3 pb-4">
          <p className="truncate text-base font-semibold text-ink">{title}</p>
          {subtitle && <p className="truncate pt-0.5 text-sm text-muted">{subtitle}</p>}
        </header>

        <div className="grid gap-1">{children}</div>
      </div>
    </div>
  )
}

interface SheetActionProps {
  onClick: () => void
  danger?: boolean
  children: ReactNode
}

export function SheetAction({ onClick, danger = false, children }: SheetActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-13 rounded-control px-4 text-left text-[0.9375rem] font-medium ${
        danger ? 'bg-out/10 text-out' : 'bg-sunken text-ink'
      }`}
    >
      {children}
    </button>
  )
}
