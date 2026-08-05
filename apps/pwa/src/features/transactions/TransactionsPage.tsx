import { Link } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useTransactions, useTogglePaid } from './hooks'
import { useCategories } from '../accounts/hooks'
import { groupByDay, peakNet } from './groupByDay'
import { DayGroupSection } from './components/DayGroupSection'
import { MonthHeader } from '../dashboard/components/MonthHeader'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'

export function TransactionsPage() {
  const { month, setMonth } = useMonth()
  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)

  const groups = groupByDay(transactions.data ?? [])
  const peak = peakNet(groups)
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))

  return (
    <>
      <MonthHeader month={month} onChange={setMonth} />

      <div className="flex justify-end px-4 pb-2">
        <Link to="/transacoes/novo">
          <Button>Adicionar</Button>
        </Link>
      </div>

      {transactions.isSuccess && groups.length === 0 && (
        <EmptyState
          title="Nada lançado neste mês"
          hint="Adicione um gasto ou uma entrada para começar a acompanhar."
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
    </>
  )
}
