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
  onClick?: () => void
  /** The one action the screen is for. There is at most one per bar. */
  primary?: boolean
  /** Round only where it sits inside a pill and has to match it. */
  circle?: boolean
  disabled?: boolean
  /** Lets the bar hold a form's submit, wired by id rather than by nesting. */
  type?: 'button' | 'submit'
  form?: string
}

/**
 * A squircle the size of a fingertip — the rounded square the platform moved to,
 * which reads as a control rather than as a badge. It stays a circle only where
 * it sits inside a pill and has to match its curve.
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
  circle = false,
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
      className={`grid shrink-0 place-items-center disabled:opacity-30 ${
        circle ? 'size-9 rounded-full' : 'size-10 rounded-2xl'
      } ${
        primary
          ? 'bg-accent text-brand ring-2 ring-accent/35 shadow-[0_3px_14px_-3px_var(--color-accent)]'
          : 'bg-sunken text-ink'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
