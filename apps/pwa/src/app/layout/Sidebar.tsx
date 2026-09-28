import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Avatar } from '@/ui/Avatar'
import { PigMark } from '@/ui/PigMark'
import { ThemeSwitch } from '@/ui/ThemeSwitch'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MoonIcon,
  OutflowIcon,
  SunIcon,
  WalletIcon,
  type AppIcon,
} from '@/ui/icons'
import { useGreeting } from '@/app/useGreeting'
import { setTheme, useTheme } from '@/app/theme'
import { useActiveLedger } from '@/app/ledger/activeLedgerContext'
import { spaceKind, spaceName } from '@/features/dashboard/space'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onOpenProfile: () => void
  onOpenAccounts: () => void
}

/**
 * The desktop's header, turned on its side.
 *
 * Everything the phone keeps in the identity row lives here: whose money this
 * is at the top, where to go in the middle, the appearance at the foot. The
 * search and the bell stay behind — search moved into the page it filters,
 * and the bell has nothing to ring yet.
 *
 * Collapsed, it keeps every control and drops every word. The labels move into
 * tooltips, and the two-segment theme switch becomes one button that flips it,
 * since two segments do not fit a column one icon wide.
 */
export function Sidebar({ collapsed, onToggle, onOpenProfile, onOpenAccounts }: SidebarProps) {
  const { firstName, avatarUrl } = useGreeting()
  const { current } = useActiveLedger()
  const { search } = useLocation()

  const space = spaceName(current) || firstName || 'Você'

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div
        className={`flex items-center pt-6 pb-5 ${collapsed ? 'flex-col gap-3 px-0' : 'gap-2 px-5'}`}
      >
        <PigMark className="size-7 shrink-0" />

        {!collapsed && (
          <span className="flex-1 truncate text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">
            Conta Gorda
          </span>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={`${collapsed ? 'Expandir' : 'Recolher'} menu ( [ )`}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          {collapsed ? (
            <ChevronRightIcon className="size-4" strokeWidth={2} aria-hidden="true" />
          ) : (
            <ChevronLeftIcon className="size-4" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className={collapsed ? 'flex justify-center' : 'px-3'}>
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={collapsed ? `${space}, abrir conta` : undefined}
          title={collapsed ? space : undefined}
          className={`flex items-center gap-2.5 rounded-control text-left transition-colors hover:bg-sunken ${
            collapsed ? 'p-1' : 'w-full border border-line bg-surface px-2 py-2'
          }`}
        >
          <Avatar name={firstName} url={avatarUrl} />

          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{space}</span>
                <span className="block truncate text-xs text-muted">{spaceKind(current)}</span>
              </span>

              <ChevronDownIcon className="size-4 shrink-0 text-muted" />
            </>
          )}
        </button>
      </div>

      <nav aria-label="Principal" className={`grid gap-0.5 pt-6 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        <SidebarLink to={{ pathname: '/', search }} icon={HomeIcon} shortcut="1" collapsed={collapsed} end>
          Mês
        </SidebarLink>

        <SidebarLink to={{ pathname: '/stats', search }} icon={OutflowIcon} shortcut="2" collapsed={collapsed}>
          Despesas
        </SidebarLink>

        <SidebarButton onClick={onOpenAccounts} icon={WalletIcon} shortcut="3" collapsed={collapsed}>
          Contas
        </SidebarButton>
      </nav>

      <div
        className={`mt-auto flex items-center border-t border-line py-4 ${
          collapsed ? 'justify-center' : 'justify-between gap-2 px-5'
        }`}
      >
        {collapsed ? (
          <ThemeToggle />
        ) : (
          <>
            <span className="text-xs text-muted">Aparência</span>

            <ThemeSwitch />
          </>
        )}
      </div>
    </aside>
  )
}

const ITEM = 'flex h-9 items-center gap-2.5 rounded-chip text-sm font-medium transition-colors'

interface ItemProps {
  icon: AppIcon
  shortcut: string
  collapsed: boolean
  children: string
}

function itemLayout(collapsed: boolean): string {
  return collapsed ? `${ITEM} justify-center` : `${ITEM} px-2.5`
}

function SidebarLink({
  to,
  icon: Icon,
  shortcut,
  collapsed,
  end = false,
  children,
}: ItemProps & { to: { pathname: string; search: string }; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={collapsed ? children : undefined}
      title={collapsed ? `${children} (${shortcut})` : undefined}
      className={({ isActive }) =>
        `${itemLayout(collapsed)} ${
          isActive ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken/60 hover:text-ink'
        }`
      }
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />

      {!collapsed && (
        <>
          <span className="flex-1">{children}</span>
          <Kbd>{shortcut}</Kbd>
        </>
      )}
    </NavLink>
  )
}

function SidebarButton({
  onClick,
  icon: Icon,
  shortcut,
  collapsed,
  children,
}: ItemProps & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? children : undefined}
      title={collapsed ? `${children} (${shortcut})` : undefined}
      className={`${itemLayout(collapsed)} text-muted hover:bg-sunken/60 hover:text-ink`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />

      {!collapsed && (
        <>
          <span className="flex-1 text-left">{children}</span>
          <Kbd>{shortcut}</Kbd>
        </>
      )}
    </button>
  )
}

function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? 'Usar tema escuro' : 'Usar tema claro'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-xl bg-sunken text-ink"
    >
      {theme === 'dark' ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="grid h-5 min-w-5 place-items-center rounded-md border border-line px-1 font-sans text-[0.6875rem] text-faint">
      {children}
    </kbd>
  )
}
