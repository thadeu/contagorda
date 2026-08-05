import type { ReactNode } from 'react'
import type { AppIcon } from './icons'

interface NavBarProps {
  title: string
  /** A control, never decoration — the slot is tappable or it is empty. */
  leading?: ReactNode
  trailing?: ReactNode
  /**
   * Set when the bar is the top of a screen rather than the top of a panel. A
   * modal opens below the status bar and must not pad for it a second time.
   */
  topInset?: boolean
}

/**
 * Title in the middle, one control on each side.
 *
 * The two sides are equal-width and grow together, so the title stays optically
 * centred whether the sides hold one control, two, or none. Centring by text
 * alone drifts as soon as the controls differ in width, and the drift is the
 * kind that is only obvious once someone points at it.
 *
 * Titles here are the small, fixed kind. The large title belongs to the month
 * view, where a greeting is the point of the screen; on a list of accounts the
 * name is a label, and a label competing with the content is noise.
 */
export function NavBar({ title, leading, trailing, topInset = false }: NavBarProps) {
  return (
    <header
      className={`flex items-center gap-2 px-4 pb-3 ${
        topInset ? 'pt-[calc(env(safe-area-inset-top)+0.75rem)]' : 'pt-3'
      }`}
    >
      <div className="flex flex-1 justify-start">{leading}</div>

      <h1 className="truncate text-[1.0625rem] font-semibold text-ink">{title}</h1>

      <div className="flex flex-1 justify-end">{trailing}</div>
    </header>
  )
}

interface NavButtonProps {
  icon: AppIcon
  label: string
  onClick: () => void
  /** The one action the screen is for. There is at most one per bar. */
  primary?: boolean
}

/**
 * A circle the size of a fingertip.
 *
 * The primary one carries the dark surface so the eye finds it without reading;
 * everything else is quiet. Two filled circles in one bar would cancel that out.
 */
export function NavButton({ icon: Icon, label, onClick, primary = false }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid size-9 shrink-0 place-items-center rounded-full ${
        primary ? 'bg-brand text-white' : 'bg-sunken text-ink'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
