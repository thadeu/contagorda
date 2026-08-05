import { Link } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useMonthSummary, useTransactions, useTogglePaid } from '../transactions/hooks'
import { useCategories } from '../accounts/hooks'
import { groupByDay, peakNet } from '../transactions/groupByDay'
import { DayGroupSection } from '../transactions/components/DayGroupSection'
import { MonthHeader } from './components/MonthHeader'
import { Money } from '../../ui/Money'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'

export function DashboardPage() {
  const { month, setMonth } = useMonth()
  const summary = useMonthSummary(month)
  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)

  const groups = groupByDay(transactions.data ?? [])
  const peak = peakNet(groups)
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))

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

      <div className="pt-4">
        {transactions.isPending && <p className="px-4 py-10 text-sm text-faint">Carregando…</p>}

        {transactions.isError && (
          <EmptyState
            title="Não deu para carregar o mês"
            hint="Verifique a conexão e tente de novo."
            action={<Button onClick={() => transactions.refetch()}>Tentar de novo</Button>}
          />
        )}

        {transactions.isSuccess && groups.length === 0 && (
          <EmptyState
            title="Nada lançado neste mês"
            hint="Adicione um gasto ou uma entrada para começar a acompanhar."
            action={
              <Link to="/transacoes/novo">
                <Button>Adicionar lançamento</Button>
              </Link>
            }
          />
        )}

        {groups.map((group) => (
          <DayGroupSection
            key={group.date}
            group={group}
            peakCents={peak}
            categories={categoryMap}
            onTogglePaid={(t) => togglePaid.mutate({ id: t.id, paid: t.paid_at === null })}
          />
        ))}
      </div>
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
