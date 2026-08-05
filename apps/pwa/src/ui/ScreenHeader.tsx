import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  /** The quiet line above the title. */
  eyebrow?: string
  title: string
  /** Controls that belong with the title, aligned to its right. */
  actions?: ReactNode
}

/**
 * A dark band, and not for looks: with a translucent status bar iOS draws the
 * clock and battery in white, so anything light at the top of the screen makes
 * them unreadable.
 *
 * The title is the largest thing on it. That is the shape the platform opens a
 * screen with — a quiet line naming the context, then the subject at full
 * weight — and it is what makes the top read as a place rather than a label.
 */
export function ScreenHeader({ eyebrow, title, actions }: ScreenHeaderProps) {
  return (
    <header className="rounded-b-card bg-brand px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-7 text-white">
      {eyebrow && <p className="text-[0.9375rem] text-white/55">{eyebrow}</p>}

      <div className="flex items-end justify-between gap-3 pt-0.5">
        <h1 className="text-[2rem] leading-none font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-1.5 pb-1">{actions}</div>}
      </div>
    </header>
  )
}
