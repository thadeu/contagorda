import { Notice } from './Notice'

interface TopAlertProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Bad news, delivered where the system delivers it — and in the same chrome as
 * an undo, because both are the app reporting what just happened.
 *
 * A dialog in the middle of the screen demands an answer. This reports, and
 * leaves the way out beside it.
 */
export function TopAlert({ title, message, actionLabel, onAction }: TopAlertProps) {
  return (
    <Notice role="alert">
      <p className="text-[0.9375rem] font-semibold text-ink">{title}</p>
      <p className="pt-1 text-sm leading-relaxed text-muted">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 min-h-10 w-full rounded-2xl bg-sunken px-4 text-sm font-semibold text-ink"
        >
          {actionLabel}
        </button>
      )}
    </Notice>
  )
}
