import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  /** The quiet line above the title. */
  eyebrow?: string
  title: string
  /** Sits opposite the title — an avatar, or a single control. */
  trailing?: ReactNode
}

/**
 * Light, like the references. The greeting is the largest thing on the screen
 * and everything else defers to it.
 *
 * There is no coloured band. A full-bleed dark header with a curved bottom edge
 * belongs to a specific era and is the first thing that dates a screen — the
 * platform moved to letting content start at the top and carrying colour in the
 * cards instead.
 */
export function ScreenHeader({ eyebrow, title, trailing }: ScreenHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-1">
      <div className="min-w-0">
        {eyebrow && <p className="text-[0.9375rem] text-muted">{eyebrow}</p>}
        <h1 className="truncate text-[2.125rem] leading-tight font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>
      </div>

      {trailing && <div className="shrink-0 pt-1">{trailing}</div>}
    </header>
  )
}
