import { createContext, use } from 'react'

export interface AccountEditor {
  openNew: () => void
  openEdit: (id: string) => void
}

export const AccountEditorContext = createContext<AccountEditor | null>(null)

export function useAccountEditor(): AccountEditor {
  const editor = use(AccountEditorContext)

  if (!editor) {
    throw new Error('useAccountEditor precisa estar dentro de AccountEditorProvider')
  }

  return editor
}
