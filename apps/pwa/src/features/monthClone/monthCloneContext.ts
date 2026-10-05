import { createContext, use } from 'react'

export interface MonthCloner {
  /** Opens the sheet that asks where the rows of this month should go. */
  openFrom: (source: string) => void
}

export const MonthClonerContext = createContext<MonthCloner | null>(null)

/**
 * Starting a copy from anywhere, without threading it there.
 *
 * The button lives in the month picker, which is a sheet inside the month bar,
 * while the progress has to outlive both: the picker closes the moment you tap,
 * and the copy is still running. One provider owns the sheet and the progress,
 * and the picker only asks it to begin.
 */
export function useMonthCloner(): MonthCloner {
  const cloner = use(MonthClonerContext)

  if (!cloner) {
    throw new Error('useMonthCloner precisa estar dentro de MonthCloneProvider')
  }

  return cloner
}
