import { useMonth } from '../../app/useMonth'
import { useGreeting } from '../../app/useGreeting'
import { useTransactions } from '../transactions/hooks'
import { MonthList } from '../transactions/MonthList'
import { MonthStack } from './components/MonthStack'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'

// The greeting stays one quiet line. The figure below is the hero, and two
// headlines competing means neither of them wins.
export function DashboardPage() {
  const { month, setMonth } = useMonth()
  const { salutation, firstName, avatarUrl } = useGreeting()
  const transactions = useTransactions(month)

  const rows = transactions.data ?? []
  const expenses = rows.filter((t) => t.kind === 'expense')
  const paid = expenses.filter((t) => t.paid_at !== null)

  const totalCents = sum(expenses)
  const paidCents = sum(paid)

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4">
        <p className="truncate text-[0.9375rem] text-muted">
          {salutation}
          {firstName && <span className="font-semibold text-ink">, {firstName}</span>}
        </p>

        <Avatar name={firstName} url={avatarUrl} />
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
