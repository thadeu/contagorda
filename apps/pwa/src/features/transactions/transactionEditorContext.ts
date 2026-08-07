import { createContext, use } from 'react'
import type { Scope } from '@/services/ports'

export interface TransactionEditor {
  openNew: () => void
  /** `scope` comes from the sheet that asked how far the edit should reach. */
  openEdit: (id: string, scope?: Scope) => void
}

export const TransactionEditorContext = createContext<TransactionEditor | null>(null)

/**
 * Opening the editor from anywhere, without threading it there.
 *
 * The two ways in are far apart in the tree — the add button lives in the tab
 * bar, and edit is chosen inside a sheet opened from a row deep in the list.
 * Passing a handler down to both would touch every component in between for
 * something none of them care about. Both ask for the editor directly instead,
 * and there is exactly one of it.
 */
export function useTransactionEditor(): TransactionEditor {
  const editor = use(TransactionEditorContext)

  if (!editor) {
    throw new Error('useTransactionEditor precisa estar dentro de TransactionEditorProvider')
  }

  return editor
}
