import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card-shadow rounded-[--radius-card] bg-surface ${className}`}>{children}</div>
  )
}
