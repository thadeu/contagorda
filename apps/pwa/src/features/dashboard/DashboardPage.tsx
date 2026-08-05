import { useMonth } from '../../app/useMonth'
import { useGreeting } from '../../app/useGreeting'
import { useTransactions } from '../transactions/hooks'
import { MonthList } from '../transactions/MonthList'
import { MonthStack } from './components/MonthStack'
import { ProfileButton } from './components/ProfileButton'
import { Card } from '../../ui/Card'
import { useDocumentCanvas } from '../../ui/useDocumentCanvas'

export function DashboardPage() {
  const { month, setMonth } = useMonth()
  const { salutation, firstName, avatarUrl, email } = useGreeting()
  const transactions = useTransactions(month)

  useDocumentCanvas('sky')

  const rows = transactions.data ?? []
  const expenses = rows.filter((t) => t.kind === 'expense')
  const paid = expenses.filter((t) => t.paid_at !== null)

  const totalCents = sum(expenses)
  const paidCents = sum(paid)

  return (
    <>
      <header className="flex items-start justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-5">
        <div className="min-w-0">
          <h1 className="text-[1.625rem] leading-[1.15] font-bold tracking-[-0.02em] text-ink">
            {salutation}
          </h1>
          {firstName && (
            <p className="truncate pt-0.5 text-base leading-tight font-medium text-ink/70">
              {firstName}
            </p>
          )}
        </div>

        <ProfileButton name={firstName} email={email} avatarUrl={avatarUrl} />
      </header>

      <div className="px-4">
        <MonthStack
          month={month}
          onMonthChange={setMonth}
          remainingCents={totalCents - paidCents}
          paidCents={paidCents}
          totalCents={totalCents}
        />
      </div>

      <div className="px-4 pt-3">
        <Card className="flex items-center gap-2.5 px-4 py-3">
          <span aria-hidden="true">✨</span>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">
              {paid.length} de {expenses.length}
            </span>{' '}
            {expenses.length === 1 ? 'lançamento pago' : 'lançamentos pagos'} neste mês
          </p>
        </Card>
      </div>

      <MonthList month={month} />
    </>
  )
}

function sum(rows: { amount_cents: number }[]): number {
  return rows.reduce((total, row) => total + row.amount_cents, 0)
}
