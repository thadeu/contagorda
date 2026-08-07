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
      className={`flex items-center gap-2 px-3.5 pb-3 ${
        topInset ? 'pt-[calc(env(safe-area-inset-top)+0.1rem)]' : 'pt-3'
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
  /**
   * For a bar sitting on the page rather than on a card.
   *
   * The quiet chip is `bg-sunken`, which is a step down from a white surface —
   * and on the history screen the page *is* a step down, so the two land on
   * almost the same grey and the controls disappear into it. This paints them
   * with the raised dark instead, which is a step in a direction the page has
   * not already taken.
   */
  solid?: boolean
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
  solid = false,
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
          ? 'bg-fill text-on-fill ring-2 ring-fill/30 shadow-[0_3px_14px_-3px_var(--color-fill)]'
          : solid
            ? 'bg-inverse text-white'
            : 'bg-sunken text-ink'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

interface NavActionProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  form?: string
}

/**
 * The word, where the tick used to be.
 *
 * A check mark in the corner is the platform's shorthand and it only works once
 * somebody already knows what it commits. Here it sat opposite a close button on
 * a panel that can create money or change it, and the two icons made the choice
 * look symmetrical when only one of them writes anything down. "Salvar" says
 * which is which without being read twice.
 *
 * Text and not a filled button. Filled would make it the loudest thing on a
 * panel whose subject is an amount, and it is already the only word up there —
 * colour alone is enough to separate it from a title. It takes the fill colour
 * rather than the accent for the same reason the filled controls do: on a light
 * page the pale blue that reads well as a mark reads badly as a commitment.
 */
export function NavAction({ label, onClick, disabled = false, type = 'button', form }: NavActionProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="min-h-10 shrink-0 rounded-2xl px-1 text-[0.9375rem] font-semibold text-fill disabled:opacity-40"
    >
      {label}
    </button>
  )
}
