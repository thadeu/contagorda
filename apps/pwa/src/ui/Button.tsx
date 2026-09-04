import type { ButtonHTMLAttributes } from 'react'

/**
 * The same corner as the nav buttons and the filter chips. A pill next to a
 * squircle reads as two controls from two different screens, and the app had
 * drifted into having both.
 *
 * The filled one is ink on canvas, which inverts with the theme: near-black on a
 * light page, near-white on a dark one. It used to be the brand near-black, and
 * on a dark sheet that is a button the same colour as what it sits on — present
 * in the markup and invisible on the screen.
 */
type Variant = 'primary' | 'ghost' | 'danger'

const STYLES: Record<Variant, string> = {
  primary: 'bg-ink text-canvas ',
  ghost: 'bg-surface text-ink card-shadow ',
  danger: 'bg-out/10 text-out ',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40 ${STYLES[variant]} ${className}`}
      {...props}
    />
  )
}
