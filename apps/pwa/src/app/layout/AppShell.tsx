import { Link, NavLink, Outlet, useLocation } from 'react-router'

const TABS = [
  { to: '/', label: 'Mês', end: true },
  { to: '/contas', label: 'Contas', end: false },
]

/**
 * Toolbar on top, tabs at the bottom.
 *
 * The tabs sit low because the top of a 6" screen is out of thumb reach and
 * they are used constantly. The add action sits in the toolbar following the
 * platform convention, which puts it in the hardest corner to reach — worth
 * watching once this is on a real phone, since adding an expense is the most
 * repeated action here.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const onForm = pathname.includes('/novo') || pathname.includes('/editar')

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-ink">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-ink/95 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur">
        <Link to="/" className="font-display text-base tracking-tight text-text">
          Conta Gorda
        </Link>

        {!onForm && (
          <Link
            to="/transacoes/novo"
            aria-label="Adicionar lançamento"
            className="grid size-9 place-items-center rounded-full border border-hairline text-lg leading-none text-text transition-colors hover:border-hairline-strong hover:bg-raised"
          >
            +
          </Link>
        )}
      </header>

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
                  `flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors ${
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
