import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { HomeIcon, PlusIcon, WalletIcon } from '../../ui/icons'
import { useHideOnScroll } from '../useHideOnScroll'

const TABS = [
  { to: '/', label: 'Mês', end: true, Icon: HomeIcon },
  { to: '/contas', label: 'Contas', end: false, Icon: WalletIcon },
]

/**
 * A floating pill rather than a bar pinned to the edge — the shape iOS moved to
 * once the home indicator took over the bottom strip.
 *
 * It gets out of the way while the list is being read and returns the moment
 * the finger goes back up. The add action lives here, in the middle of the
 * thumb's arc, rather than in a top-right toolbar: it is the most repeated
 * action in the app and the top corner is the furthest point from a thumb.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const hidden = useHideOnScroll()
  const onForm = pathname.includes('/novo') || pathname.includes('/editar')

  return (
    <div className="mx-auto min-h-full max-w-lg bg-canvas">
      <main className="pb-32">
        <Outlet />
      </main>

      {!onForm && (
        <nav
          data-hidden={hidden}
          className="slide-away pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-brand p-1.5 shadow-[0_8px_32px_-8px_rgba(13,20,16,0.45)]">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                    isActive ? 'bg-lime text-brand' : 'text-white/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.Icon className="size-4" />
                    {isActive && tab.label}
                  </>
                )}
              </NavLink>
            ))}

            <Link
              to="/transacoes/novo"
              aria-label="Adicionar lançamento"
              className="grid size-11 place-items-center rounded-full bg-white text-brand"
            >
              <PlusIcon className="size-5" />
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}
