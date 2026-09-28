import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useMonth } from '@/app/useMonth'
import { shiftMonth } from '@/lib/dates'
import { useTransactionEditor } from '@/features/transactions/transactionEditorContext'

/** Where `/` sends the focus. Any page that has a search box marks it with this. */
export const SEARCH_INPUT_ATTR = 'data-search-input'

/**
 * The keys the desktop answers to.
 *
 * Plain keys and not ⌘-chords: ⌘1–⌘9 belong to the browser, which switches
 * tabs with them before the page hears anything, so a shortcut there would be
 * one that never fires in Brave or Chrome.
 *
 * Nothing fires while typing. A form in the side panel is the common case, and
 * an "n" in a description must stay an "n".
 */
interface ShortcutActions {
  onOpenAccounts: () => void
  onToggleSidebar: () => void
}

export function useDesktopShortcuts({ onOpenAccounts, onToggleSidebar }: ShortcutActions) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { month, setMonth } = useMonth()
  const editor = useTransactionEditor()

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return

      const monthAware = pathname === '/' || pathname === '/stats'

      switch (event.key) {
        case 'n':
        case 'N':
          event.preventDefault()
          editor.openNew()
          break

        case 'ArrowLeft':
        case 'ArrowRight':
          if (!monthAware) return

          event.preventDefault()
          setMonth(shiftMonth(month, event.key === 'ArrowLeft' ? -1 : 1))
          break

        case '/':
          event.preventDefault()
          document.querySelector<HTMLInputElement>(`[${SEARCH_INPUT_ATTR}]`)?.focus()
          break

        case '1':
          navigate({ pathname: '/', search })
          break

        case '2':
          navigate({ pathname: '/stats', search })
          break

        case '3':
          onOpenAccounts()
          break

        case '[':
          event.preventDefault()
          onToggleSidebar()
          break
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [editor, month, navigate, onOpenAccounts, onToggleSidebar, pathname, search, setMonth])
}

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}
