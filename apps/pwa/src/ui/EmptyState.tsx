import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  hint: string
  action?: ReactNode
}

/**
 * An empty screen is an invitation to act, so it says what to do next rather
 * than reporting that a list has no items.
 */
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
