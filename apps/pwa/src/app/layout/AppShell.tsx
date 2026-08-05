import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: '/', label: 'Mês', end: true },
  { to: '/transacoes', label: 'Lançamentos', end: false },
  { to: '/contas', label: 'Contas', end: false },
]

/**
 * Bottom navigation, because this is a phone app first: the top of a 6" screen
 * is out of thumb reach, and the tabs are the most-used control here.
 *
 * The safe-area padding sits on the nav itself rather than on an inner element,
 * so the bar grows to cover the home indicator instead of floating above it.
 */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-ink">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-hairline bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                    isActive ? 'text-text' : 'text-faint hover:text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`h-0.5 w-6 rounded-full transition-colors ${
                        isActive ? 'bg-amber' : 'bg-transparent'
                      }`}
                    />
                    {tab.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
