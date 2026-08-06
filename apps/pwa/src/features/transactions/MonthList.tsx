import { useState } from 'react'
import { useDeleteTransaction, useTransactions, useTogglePaid } from './hooks'
import { useCategories } from '../accounts/hooks'
import { groupByDay } from './groupByDay'
import { matchesStatus, orderFor, useStatusFilter } from './useStatusFilter'
import { DayGroupSection } from './components/DayGroupSection'
import { StatusTabs } from './components/StatusTabs'
import { TransactionSheet } from './components/TransactionSheet'
import { EmptyState } from '../../ui/EmptyState'
import { NavButton } from '../../ui/NavBar'
import { PlusIcon } from '../../ui/icons'
import { Button } from '../../ui/Button'
import { UndoBar } from '../../ui/UndoBar'
import { useTransactionEditor } from './transactionEditorContext'
import type { Transaction } from '../../services/types'

interface MonthListProps {
  month: string
}

/**
 * Filtering happens here rather than in the query so both tabs read one cached
 * month: switching between them is instant and costs no request, which matters
 * when that flick is the main interaction.
 */
export function MonthList({ month }: MonthListProps) {
  const { status, setStatus } = useStatusFilter()
  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)
  const remove = useDeleteTransaction(month)

  const [sheet, setSheet] = useState<Transaction | null>(null)
  const [undo, setUndo] = useState<Transaction | null>(null)

  const editor = useTransactionEditor()
  const all = transactions.data ?? []
  const pending = all.filter((t) => t.paid_at === null)
  const visible = all.filter((t) => matchesStatus(t, status))

  const groups = groupByDay(visible, orderFor(status))
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))

  function handleToggle(transaction: Transaction) {
    const nextPaid = transaction.paid_at === null

    togglePaid.mutate({ id: transaction.id, paid: nextPaid })

    // Only the disappearing direction needs recovery. Putting a row back into
    // the list being read is its own confirmation.
    setUndo(nextPaid ? transaction : null)
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <StatusTabs status={status} onChange={setStatus} pendingCount={pending.length} />
        </div>

        <div className="flex shrink-0 rounded-full bg-sunken p-1">
          <NavButton circle primary icon={PlusIcon} label="Adicionar lançamento" onClick={editor.openNew} />
        </div>
      </div>

      <div className="px-4">
        {transactions.isPending && <p className="px-1 py-10 text-sm text-muted">Carregando…</p>}

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
            action={<Button onClick={editor.openNew}>Adicionar lançamento</Button>}
          />
        )}

        {transactions.isSuccess && groups.length === 0 && status === 'paid' && (
          <EmptyState title="Nada pago neste mês" hint="O que você marcar como pago aparece aqui." />
        )}

        {groups.length > 0 && (
          <div className="rounded-card bg-surface px-4 pt-1 pb-4">
            {groups.map((group) => (
              <DayGroupSection
                key={group.date}
                group={group}
                categories={categoryMap}
                onOpen={setSheet}
              />
            ))}
          </div>
        )}
      </div>

      {sheet && (
        <TransactionSheet
          transaction={sheet}
          onClose={() => setSheet(null)}
          onTogglePaid={handleToggle}
          onDelete={(transaction) => remove.mutate(transaction.id)}
        />
      )}

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
