import { useCallback, useState } from 'react'
import { Outlet } from 'react-router'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { useGreeting } from '@/app/useGreeting'
import { AccountsSheet } from '@/features/accounts/AccountsSheet'
import { ProfileSheet } from '@/features/dashboard/components/ProfileButton'
import { Sidebar } from './Sidebar'
import { useDesktopShortcuts } from './useDesktopShortcuts'

const COLLAPSED_KEY = 'contagorda:sidebar-collapsed'

/**
 * The sidebar remembers how it was left. Storage can be unavailable (a private
 * window, blocked site data), and then it simply opens expanded every time.
 */
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed))
  } catch {
    return
  }
}

interface DesktopShellProps {
  onPanelHost: (node: HTMLElement | null) => void
}

/**
 * Sidebar, content, panel — left to right, and the content never centres.
 *
 * The content starts where the sidebar ends and stops at a readable width. On a
 * wide monitor the spare room collects on the right, which is where the panel
 * opens, so opening it moves nothing that was already being read.
 *
 * The panel column is empty until a sheet or a modal portals into it, and
 * `empty:hidden` takes it out of the layout while it has nothing to show.
 *
 * Scrolling happens inside `main`, as on the phone, so the fading canvas and
 * the list's widening read the same scroller on both.
 */
export function DesktopShell({ onPanelHost }: DesktopShellProps) {
  const { firstName, email, avatarUrl } = useGreeting()
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const openAccounts = useCallback(() => setAccountsOpen(true), [])

  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => {
      writeCollapsed(!current)

      return !current
    })
  }, [])

  useDesktopShortcuts({ onOpenAccounts: openAccounts, onToggleSidebar: toggleSidebar })

  return (
    <div className="flex h-full bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAccounts={openAccounts}
      />

      <div className="app-surface relative flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
        <main className="app-scroll flex-1 overflow-y-auto">
          <div className="max-w-[1100px]">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <div
        ref={onPanelHost}
        className="relative w-[420px] shrink-0 overflow-hidden border-l border-line bg-overlay empty:hidden"
      />

      {profileOpen && (
        <ProfileSheet
          name={firstName || 'Sua conta'}
          email={email}
          avatarUrl={avatarUrl}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {accountsOpen && <AccountsSheet onClose={() => setAccountsOpen(false)} />}
    </div>
  )
}
