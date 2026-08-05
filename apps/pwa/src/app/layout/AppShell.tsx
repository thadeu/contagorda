import { useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { HomeIcon, PlusIcon, WalletIcon } from '../../ui/icons'
import { useHideOnScroll } from '../useHideOnScroll'

const TABS = [
  { to: '/', label: 'Mês', end: true, Icon: HomeIcon },
  { to: '/contas', label: 'Contas', end: false, Icon: WalletIcon },
]

/**
 * The frame is in normal flow, filling `#root`, and nothing here is `fixed`.
 *
 * On iOS a `position: fixed` box gets inset by the safe areas in the installed
 * app, so a frame pinned to all four sides came up smaller than the screen with
 * the page showing around it — which is the band, and why it never appeared in
 * the browser. A flow box filling a `height: 100%` chain has no such surprise,
 * and the tab bar is absolute inside it for the same reason.
 *
 * The app scrolls inside `main`, not the document. On iOS the scroll indicator
 * for the root scroller is drawn by the system and CSS cannot touch it; on any
 * other scroller `::-webkit-scrollbar` applies. It also makes freezing the page
 * behind a sheet a matter of one `overflow` property instead of pinning the
 * body and restoring its offset afterwards.
 *
 * The tab bar is a floating pill — the shape iOS moved to once the home
 * indicator took the bottom strip. It gets out of the way while the list is
 * being read and returns the moment the finger goes back up. The add action
 * lives there, in the middle of the thumb's arc, because it is the most
 * repeated action in the app.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const scroller = useRef<HTMLElement>(null)
  const hidden = useHideOnScroll(scroller)
  const onForm = pathname.includes('/novo') || pathname.includes('/editar')

  return (
    <div className="relative mx-auto flex h-full max-w-lg flex-col overflow-hidden bg-canvas">
      <main ref={scroller} className="app-scroll flex-1 overflow-y-auto overscroll-contain pb-32">
        <Outlet />
      </main>

      {!onForm && (
        <nav
          data-hidden={hidden}
          className="slide-away pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-brand p-1.5 shadow-[0_8px_32px_-8px_rgba(10,15,26,0.45)]">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                    isActive ? 'bg-accent text-brand' : 'text-white/70'
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
