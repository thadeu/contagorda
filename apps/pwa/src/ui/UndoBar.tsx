import { useEffect } from 'react'

interface UndoBarProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  /** Long enough to notice and react, short enough not to sit in the way. */
  timeoutMs?: number
}

/**
 * Marking something paid removes it from the list being read, which is exactly
 * what makes the interaction satisfying — and exactly what makes a mistaken tap
 * expensive, since the row lands in a tab the user is not looking at. This is
 * the recovery path, offered where the mistake happens rather than somewhere it
 * has to be hunted for.
 */
export function UndoBar({ message, onUndo, onDismiss, timeoutMs = 5000 }: UndoBarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, timeoutMs)

    return () => clearTimeout(timer)
  }, [onDismiss, timeoutMs, message])

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-lg items-center justify-between gap-3 border-t border-hairline bg-raised px-4 py-3"
    >
      <p className="truncate text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 text-sm font-medium text-amber underline-offset-4 hover:underline"
      >
        Desfazer
      </button>
    </div>
  )
}
