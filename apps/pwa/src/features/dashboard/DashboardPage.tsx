import { useMonth } from '../../app/useMonth'
import { useGreeting } from '../../app/useGreeting'
import { useTransactions } from '../transactions/hooks'
import { MonthList } from '../transactions/MonthList'
import { MonthStack } from './components/MonthStack'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'

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
      <header className="flex items-start justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-5">
        <h1 className="min-w-0 text-[1.75rem] leading-[1.15] font-bold tracking-[-0.02em] text-ink">
          {salutation},
          <br />
          <span className="truncate">{firstName || 'tudo bem?'}</span>
        </h1>

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
