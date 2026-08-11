
import { useRef, useState } from 'react'
import { useMonth } from '@/app/useMonth'
import { useGreeting } from '@/app/useGreeting'
import { useRefreshMonth, useTransactions } from '@/features/transactions/hooks'
import { usePullToRefresh } from '@/ui/usePullToRefresh'
import { Spinner } from '@/ui/Spinner'
import { MonthList } from '@/features/transactions/MonthList'
import { MonthStack } from './components/MonthStack'
import { ProfileSheet } from './components/ProfileButton'
import { IdentityRow } from './components/IdentityRow'
import { SpendingCard } from './components/SpendingCard'
import { TotalBalance } from './components/TotalBalance'
import { useDocumentCanvas } from '@/ui/useDocumentCanvas'
import { useFadingCanvas } from '@/ui/useFadingCanvas'
import { useActiveLedger } from '@/app/ledger/activeLedgerContext'
import { AccountsSheet } from '@/features/accounts/AccountsSheet'

export function DashboardPage() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const { month, setMonth } = useMonth()
  const { firstName, avatarUrl, email } = useGreeting()
  const transactions = useTransactions(month)

  const content = useRef<HTMLDivElement>(null)
  const { refreshing } = usePullToRefresh(content, useRefreshMonth(month))

  const { current, shared } = useActiveLedger()

  useDocumentCanvas('sky')
  useFadingCanvas()

  const rows = transactions.data ?? []
  const expenses = rows.filter((t) => t.kind === 'expense')
  const paid = expenses.filter((t) => t.paid_at !== null)

  const totalCents = sum(expenses)
  const paidCents = sum(paid)

  return (
    <div ref={content} className="relative pb-0.5" aria-busy={refreshing}>
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
        />
      </div>

      <div className="grid grid-cols-2 gap-2 px-3.5 pt-3">
        <SpendingCard month={month} />
        <TotalBalance month={month} />
      </div>

      <MonthList month={month} />
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

function sum(rows: { amount_cents: number }[]): number {
  return rows.reduce((total, row) => total + row.amount_cents, 0)
}
