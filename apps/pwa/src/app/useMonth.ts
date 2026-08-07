import { useSearchParams } from 'react-router'
import { monthKey, todayIso } from '../lib/dates'

/**
 * The selected month lives in the URL, not in component state.
 *
 * That makes a month linkable and survives a reload — which matters in an
 * installed PWA, where the system discards and restores the view constantly. A
 * useState here would snap the user back to the current month every time.
 *
 * Surviving a reload is not the same as surviving a relaunch, and the difference
 * is `forgetMonthOnColdStart`, which clears the parameter before this ever runs.
 * Opening the app is asking it where you are; it should not answer with wherever
 * you happened to be browsing the last time you closed it.
 */
export function useMonth() {
  const [params, setParams] = useSearchParams()
  const month = params.get('month') ?? monthKey(todayIso())

  function setMonth(next: string) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)

        updated.set('month', next)

        return updated
      },
      { replace: true },
    )
  }

  return { month, setMonth }
}
