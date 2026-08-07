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
  /**
   * Folds the bar away without moving the inset above it. Driven by scroll
   * direction, so the caller owns the decision and the bar owns the motion.
   */
  hidden?: boolean
}

/**
 * Title in the middle, one control on each side.
 *
 * The two sides are equal-width and grow together, so the title stays optically
 * centred whether the sides hold one control, two, or none. Centring by text
 * alone drifts as soon as the controls differ in width, and the drift is the
 * kind that is only obvious once someone points at it.
 *
 * It can fold. The row collapses to nothing and what is under it rises into the
 * space, while the safe-area inset above stays exactly where it is — that inset
 * is the status bar's, not the bar's, and animating it would slide the title of
 * the screen under the clock.
 *
 * The height animates through grid rows rather than a measured pixel value.
 * Measuring means reading layout on the first paint and again whenever the
 * content changes, and a bar whose contents differ by screen would need that
 * every time; `1fr` to `0fr` asks the browser for the same answer without the
 * bookkeeping.
 *
 * Titles here are the small, fixed kind. The large title belongs to the month
 * view, where a greeting is the point of the screen; on a list of accounts the
 * name is a label, and a label competing with the content is noise.
 */
export function NavBar({
  title,
  leading,
  trailing,
  topInset = false,
  hidden = false,
}: NavBarProps) {
  return (
    <header className={topInset ? 'pt-[env(safe-area-inset-top)]' : undefined}>
      <div
        aria-hidden={hidden}
        className={`navbar-fold grid ${hidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-3">
            <div className="flex flex-1 justify-start">{leading}</div>

            <h1 className="truncate text-[1.0625rem] font-semibold text-ink">{title}</h1>

            <div className="flex flex-1 justify-end">{trailing}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

interface NavButtonProps {
  icon: AppIcon
  label: string
  onClick?: () => void
  /** The one action the screen is for. There is at most one per bar. */
  primary?: boolean
  disabled?: boolean
  /** Lets the bar hold a form's submit, wired by id rather than by nesting. */
  type?: 'button' | 'submit'
  form?: string
}

/**
 * A squircle the size of a fingertip — the rounded square the platform moved to,
 * which reads as a control rather than as a badge. There is no round variant:
 * the last pill in the app was the segmented control this button stands beside,
 * and once that squared off, a circle here had nothing left to match.
 *
 * The primary one carries the accent, which is the one colour that holds its
 * contrast whichever way the theme goes. It used to be the near-black, and that
 * only ever worked against a light page — on a dark one it was a black circle on
 * a black background, which is how the add button went missing.
 *
 * The ring and the glow are the same accent at low opacity, so the button reads
 * as lit from within rather than outlined. A border in a second colour would be
 * a new decision to justify; this one is the fill, spread.
 *
 * Everything else is quiet. Two filled circles in one bar would cancel that out.
 */
export function NavButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
  disabled = false,
  type = 'button',
  form,
}: NavButtonProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid size-10 shrink-0 place-items-center rounded-2xl disabled:opacity-30 ${
        primary
          ? 'bg-accent text-brand ring-2 ring-accent/35 shadow-[0_3px_14px_-3px_var(--color-accent)]'
          : 'bg-sunken text-ink'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
