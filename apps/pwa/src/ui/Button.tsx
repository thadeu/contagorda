import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const STYLES: Record<Variant, string> = {
  primary: 'bg-brand text-white active:scale-[0.98]',
  ghost: 'bg-surface text-ink card-shadow active:scale-[0.98]',
  danger: 'bg-out/10 text-out active:scale-[0.98]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-transform disabled:opacity-40 ${STYLES[variant]} ${className}`}
      {...props}
    />
  )
}
