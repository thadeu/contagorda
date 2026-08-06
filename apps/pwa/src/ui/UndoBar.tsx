import { useEffect } from 'react'
import { Notice } from './Notice'

interface UndoBarProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  timeoutMs?: number
}

/**
 * Marking something paid removes it from the list being read, which is what
 * makes the interaction satisfying and what makes a mis-tap expensive — the row
 * lands in a tab nobody is looking at. This is the recovery path.
 *
 * It arrives as a notification, from the top, in the same chrome as an error.
 * The trade is reach: the top corner of a large phone is the hardest place for a
 * thumb, and there are five seconds on the clock. So the whole notice is the
 * target rather than a word at the end of it — a hundred-odd points of tappable
 * card instead of a link, which is what keeps the action recoverable from where
 * it now lives.
 *
 * Flicking it up dismisses without undoing. Letting the notice go is not the
 * same as taking the action back, and the two gestures are far enough apart —
 * a tap and a swipe — that neither is reachable by accident.
 */
export function UndoBar({ message, onUndo, onDismiss, timeoutMs = 5000 }: UndoBarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, timeoutMs)

    return () => clearTimeout(timer)
  }, [onDismiss, timeoutMs, message])

  return (
    <Notice onDismiss={onDismiss}>
      <button type="button" onClick={onUndo} className="flex w-full items-center gap-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-ink">{message}</span>
          <span className="block text-xs text-muted">Toque para desfazer</span>
        </span>

        <span className="shrink-0 text-sm font-semibold text-accent">Desfazer</span>
      </button>
    </Notice>
  )
}
