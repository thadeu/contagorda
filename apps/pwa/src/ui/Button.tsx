import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const STYLES: Record<Variant, string> = {
  primary: 'bg-text text-ink hover:bg-white',
  ghost: 'border border-hairline text-text hover:border-hairline-strong hover:bg-raised',
  danger: 'border border-out-dim text-out hover:bg-out-dim/20',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:opacity-40 ${STYLES[variant]} ${className}`}
      {...props}
    />
  )
}
