import { useMonth } from '../../app/useMonth'
import { useMonthSummary } from '../transactions/hooks'
import { MonthList } from '../transactions/MonthList'
import { MonthHeader } from './components/MonthHeader'
import { Money } from '../../ui/Money'
import { Card } from '../../ui/Card'

export function DashboardPage() {
  const { month, setMonth } = useMonth()
  const summary = useMonthSummary(month)

  return (
    <>
      <MonthHeader month={month} onChange={setMonth} />

      <section className="px-4 pt-2 pb-1">
        <p className="text-xs tracking-wide text-faint uppercase">Sobrou no mês</p>
        <p className="font-display text-[2.75rem] leading-none tracking-tight">
          {summary.data ? (
            <Money cents={summary.data.net_cents} signed emphasis />
          ) : (
            <span className="text-faint">—</span>
          )}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2 px-4 pt-4">
        <Stat label="Entrou" cents={summary.data?.income_cents} tone="text-in" />
        <Stat label="Saiu" cents={summary.data?.expense_cents} tone="text-out" />
        <Stat label="A pagar" cents={summary.data?.upcoming_cents} tone="text-muted" />
      </section>

      <MonthList month={month} />
    </>
  )
}

function Stat({ label, cents, tone }: { label: string; cents?: number; tone: string }) {
  return (
    <Card className="px-3 py-2.5">
      <p className="text-[0.6875rem] tracking-wide text-faint uppercase">{label}</p>
      <p className={`pt-0.5 text-sm ${tone}`}>
        {cents === undefined ? <span className="text-faint">—</span> : <Money cents={cents} />}
      </p>
    </Card>
  )
}
