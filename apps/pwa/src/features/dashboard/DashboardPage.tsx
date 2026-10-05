
import { useRef, useState } from 'react'
import { useMonth } from '@/app/useMonth'
import { useGreeting } from '@/app/useGreeting'
import { useRefreshMonth, useTransactions } from '@/features/transactions/hooks'
import { usePullToRefresh } from '@/ui/usePullToRefresh'
import { Spinner } from '@/ui/Spinner'
import { MonthList } from '@/features/transactions/MonthList'
import { MonthBar, MonthStack, MonthSummary } from './components/MonthStack'
import { ProfileSheet } from './components/ProfileButton'
import { IdentityRow } from './components/IdentityRow'
import { SpendingCard } from './components/SpendingCard'
import { IncomeCard } from './components/IncomeCard'
import { useDocumentCanvas } from '@/ui/useDocumentCanvas'
import { useFadingCanvas } from '@/ui/useFadingCanvas'
import { useActiveLedger } from '@/app/ledger/activeLedgerContext'
import { AccountsSheet } from '@/features/accounts/AccountsSheet'
import { SearchDock } from '@/features/search/SearchDock'
import { useIsDesktop } from '@/app/useIsDesktop'
import { SEARCH_INPUT_ATTR } from '@/app/layout/useDesktopShortcuts'
import { Kbd } from '@/app/layout/Sidebar'
import { SearchIcon } from '@/ui/icons'

export function DashboardPage() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(0)
  const { month, setMonth } = useMonth()
  const { firstName, avatarUrl, email } = useGreeting()
  const transactions = useTransactions(month)

  const content = useRef<HTMLDivElement>(null)
  const { refreshing } = usePullToRefresh(content, useRefreshMonth())

  const { current, shared } = useActiveLedger()
  const desktop = useIsDesktop()

  useDocumentCanvas('sky')
  useFadingCanvas()

  const rows = transactions.data ?? []
  const expenses = rows.filter((t) => t.kind === 'expense')
  const paid = expenses.filter((t) => t.paid_at !== null)
  const income = rows.filter((t) => t.kind === 'income')

  const totalCents = sum(expenses)
  const paidCents = sum(paid)
  const incomeCents = sum(income)

  if (desktop) {
    return (
      <div ref={content} className="px-8 pt-7 pb-16">
        <header className="flex items-center gap-3 pb-5">
          <MonthBar month={month} onMonthChange={setMonth} className="w-[22rem]" />

          <DesktopSearch value={search} onChange={setSearch} />
        </header>

        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <MonthSummary
            wide
            remainingCents={totalCents - paidCents}
            paidCents={paidCents}
            totalCents={totalCents}
            incomeCents={incomeCents}
          />

          <IncomeCard month={month} />
          <SpendingCard month={month} />
        </div>

        <div className="-mx-3.5 pt-3">
          <MonthList month={month} search={search} onVisibleCount={setVisibleCount} />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={content}
      className="relative pb-[calc(env(safe-area-inset-bottom)+4.5rem)]"
      aria-busy={refreshing}
    >
      <PullIndicator />

      <IdentityRow
        name={firstName}
        avatarUrl={avatarUrl}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAccounts={() => setAccountsOpen(true)}
      />

      {profileOpen && (
        <ProfileSheet
          name={firstName || 'Sua conta'}
          email={email}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {accountsOpen && <AccountsSheet onClose={() => setAccountsOpen(false)} />}

      {shared && current && (
        <p className="truncate px-3.5 pb-2 text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
          {current.name}
        </p>
      )}

      <div className="px-3.5">
        <MonthStack
          month={month}
          onMonthChange={setMonth}
          remainingCents={totalCents - paidCents}
          paidCents={paidCents}
          totalCents={totalCents}
          incomeCents={incomeCents}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 px-3.5 pt-3">
        <IncomeCard month={month} />
        <SpendingCard month={month} />
      </div>

      <MonthList month={month} search={search} onVisibleCount={setVisibleCount} />

      <SearchDock term={search} onTermChange={setSearch} pinned={visibleCount <= 2} />
    </div>
  )
}

/**
 * Sits above the top of the page, and is only ever seen because the page has
 * been pulled down past it.
 *
 * Its opacity is the pull itself — `--pull` runs from 0 to 1 over the distance
 * that has to be travelled before letting go means anything, so the spinner
 * arrives exactly as the gesture becomes one. Read from CSS rather than from
 * state, because the alternative is a re-render for every frame of a drag.
 */
function PullIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-9 flex justify-center opacity-[var(--pull,0)]"
    >
      <Spinner className="text-[2rem]" />
    </div>
  )
}

/**
 * The phone's search floats at the foot of the screen, where a thumb is. On the
 * desktop it sits in the page header beside the month it filters, and `/`
 * reaches it from anywhere.
 */
function DesktopSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="ml-auto flex h-11 w-72 items-center gap-2 rounded-control border border-line bg-surface px-3.5 focus-within:border-muted">
      <SearchIcon className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />

      <input
        {...{ [SEARCH_INPUT_ATTR]: '' }}
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Buscar no mês"
        aria-label="Buscar lançamentos"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return

          onChange('')
          event.currentTarget.blur()
        }}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />

      {value === '' && <Kbd>/</Kbd>}
    </label>
  )
}

function sum(rows: { amount_cents: number }[]): number {
  return rows.reduce((total, row) => total + row.amount_cents, 0)
}
