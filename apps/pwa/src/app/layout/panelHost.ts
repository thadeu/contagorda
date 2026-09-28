import { createContext, use } from 'react'

/**
 * The column on the right of the desktop frame, where a `Modal` lands instead
 * of rising from the bottom.
 *
 * Null outside the desktop frame, and also for the first render inside it,
 * before the column has mounted and handed over its node.
 */
export const PanelHostContext = createContext<HTMLElement | null>(null)

export function usePanelHost(): HTMLElement | null {
  return use(PanelHostContext)
}
