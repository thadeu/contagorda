import { useState } from 'react'
import { Link } from 'react-router'
import { useTransactions, useTogglePaid } from './hooks'
import { useCategories } from '../accounts/hooks'
import { groupByDay } from './groupByDay'
import { matchesStatus, orderFor, useStatusFilter } from './useStatusFilter'
import { DayGroupSection } from './components/DayGroupSection'
import { StatusTabs } from './components/StatusTabs'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'
import { UndoBar } from '../../ui/UndoBar'
import type { Transaction } from '../../services/types'

interface MonthListProps {
  month: string
}

/**
 * The filtered list, shared by the month view and the transactions screen.
 *
 * Filtering happens here rather than in the query so both tabs read one cached
 * month: switching between them is instant and costs no request, which matters
 * when the whole interaction is flicking back and forth to check what is left.
 */
export function MonthList({ month }: MonthListProps) {
  const { status, setStatus } = useStatusFilter()
  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)

  const [undo, setUndo] = useState<Transaction | null>(null)

  const all = transactions.data ?? []
  const pending = all.filter((t) => t.paid_at === null)
  const visible = all.filter((t) => matchesStatus(t, status))

  const groups = groupByDay(visible, orderFor(status))
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))

  function handleToggle(transaction: Transaction) {
    const nextPaid = transaction.paid_at === null

    togglePaid.mutate({ id: transaction.id, paid: nextPaid })

    // Only the disappearing direction needs recovery. Un-paying puts the row
    // back in the list being read, which is its own confirmation.
    setUndo(nextPaid ? transaction : null)
  }

  return (
    <>
      <div className="px-4 pt-4">
        <StatusTabs status={status} onChange={setStatus} pendingCount={pending.length} />
      </div>

      <div className="px-4">
        {transactions.isPending && <p className="px-4 py-10 text-sm text-faint">Carregando…</p>}

        {transactions.isError && (
          <EmptyState
            title="Não deu para carregar o mês"
            hint="Verifique a conexão e tente de novo."
            action={<Button onClick={() => transactions.refetch()}>Tentar de novo</Button>}
          />
        )}

        {transactions.isSuccess && groups.length === 0 && status === 'pending' && (
          <EmptyState
            title="Nada pendente neste mês"
            hint="Tudo que estava marcado já foi pago. Novas contas aparecem aqui."
            action={
              <Link to="/transacoes/novo">
                <Button>Adicionar lançamento</Button>
              </Link>
            }
          />
        )}

        {transactions.isSuccess && groups.length === 0 && status === 'paid' && (
          <EmptyState
            title="Nada pago neste mês"
            hint="O que você marcar como pago aparece aqui."
          />
        )}

        {groups.map((group) => (
          <DayGroupSection
            key={group.date}
            group={group}
            categories={categoryMap}
            onTogglePaid={handleToggle}
          />
        ))}
      </div>

      {undo && (
        <UndoBar
          message={`${undo.description} · pago`}
          onUndo={() => {
            togglePaid.mutate({ id: undo.id, paid: false })
            setUndo(null)
          }}
          onDismiss={() => setUndo(null)}
        />
      )}
    </>
  )
}
