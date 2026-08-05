import { useMonth } from '../../app/useMonth'
import { useMonthSummary, useTransactions } from '../transactions/hooks'
import { MonthList } from '../transactions/MonthList'
import { MonthHeader } from './components/MonthHeader'
import { RemainingCard } from './components/RemainingCard'
import { Money } from '../../ui/Money'
import { Card } from '../../ui/Card'

export function DashboardPage() {
  const { month, setMonth } = useMonth()
  const summary = useMonthSummary(month)
  const transactions = useTransactions(month)

  const rows = transactions.data ?? []
  const settled = rows.filter((t) => t.paid_at !== null).length
  const remaining = rows
    .filter((t) => t.paid_at === null && t.kind === 'expense')
    .reduce((total, t) => total + t.amount_cents, 0)

  return (
    <>
      <MonthHeader month={month} onChange={setMonth} />

      <div className="px-4">
        <RemainingCard
          remainingCents={remaining}
          settledCount={settled}
          totalCount={rows.length}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 px-4 pt-3">
        <Stat label="Entrou" cents={summary.data?.income_cents} tone="in" />
        <Stat label="Saiu" cents={summary.data?.expense_cents} tone="default" />
      </section>

      <MonthList month={month} />
    </>
  )
}

function Stat({
  label,
  cents,
  tone,
}: {
  label: string
  cents?: number
  tone: 'in' | 'default'
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="pt-0.5 text-lg font-semibold">
        {cents === undefined ? (
          <span className="text-faint">—</span>
        ) : (
          <Money cents={cents} tone={tone} />
        )}
      </p>
    </Card>
  )
}
