import { useEffect } from 'react'

interface UndoBarProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  timeoutMs?: number
}

/**
 * Marking something paid removes it from the list being read, which is what
 * makes the interaction satisfying and what makes a mis-tap expensive — the row
 * lands in a tab nobody is looking at. This is the recovery path, offered where
 * the mistake happens.
 */
export function UndoBar({ message, onUndo, onDismiss, timeoutMs = 5000 }: UndoBarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, timeoutMs)

    return () => clearTimeout(timer)
  }, [onDismiss, timeoutMs, message])

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-full bg-brand px-5 py-3 text-white shadow-[0_8px_32px_-8px_rgba(13,20,16,0.45)]"
    >
      <p className="truncate text-sm text-white/80">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 text-sm font-semibold text-accent"
      >
        Desfazer
      </button>
    </div>
  )
}
