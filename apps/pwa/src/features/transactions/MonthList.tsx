import { useEffect, useState } from 'react'
import { useDeleteTransaction, useTransactions, useTogglePaid } from './hooks'
import { useCategories } from '@/features/accounts/hooks'
import { groupByDay } from './groupByDay'
import { groupsByDay, sortRows } from './sorting'
import { LIST_ORDER, matchesView, useStatusFilter } from './useStatusFilter'
import { DayGroupSection } from './components/DayGroupSection'
import { FilterSheet } from './components/FilterSheet'
import { StatusToggle } from './components/StatusToggle'
import { ScopeChip } from './components/ScopeChip'
import { TransactionRow } from './components/TransactionRow'
import { TransactionSheet } from './components/TransactionSheet'
import { EmptyState } from '@/ui/EmptyState'
import { NavButton } from '@/ui/NavBar'
import { FilterIcon, PlusIcon } from '@/ui/icons'
import { Button } from '@/ui/Button'
import { UndoBar } from '@/ui/UndoBar'
import { useTransactionEditor } from './transactionEditorContext'
import type { Transaction } from '@/services/types'
import { fold } from '@/lib/text'

interface MonthListProps {
  month: string
  /** What the search bar holds. While it holds anything, status and scope step aside. */
  search?: string
  /**
   * How many rows are actually on screen, after every filter. The search bar
   * reads it to know whether there is a list to get out of the way of — and
   * "A pagar" with one row left is a short list however long the month is.
   */
  onVisibleCount?: (count: number) => void
}

/**
 * Filtering happens here rather than in the query so both tabs read one cached
 * month: switching between them is instant and costs no request, which matters
 * when that flick is the main interaction.
 *
 * The header is one row: what the month amounts to, then the two things you can
 * do to the list. The count and the controls used to be two blocks stacked, and
 * the segmented control held a permanent strip to answer a question asked once a
 * session — which left nowhere to put sorting without taking another.
 *
 * A search reads across the whole month, paid or not, income or expense: the
 * question being asked is "where is that row", and a tab that hides the answer
 * turns a search into a guess about which tab to be on first.
 */
export function MonthList({ month, search = '', onVisibleCount }: MonthListProps) {
  const { status, scope, sort, setStatus, setScope, setSort } = useStatusFilter()
  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)
  const remove = useDeleteTransaction(month)

  const [sheet, setSheet] = useState<Transaction | null>(null)
  const [undo, setUndo] = useState<Transaction | null>(null)
  const [filtering, setFiltering] = useState(false)

  const editor = useTransactionEditor()
  const all = transactions.data ?? []
  const paid = all.filter((t) => t.paid_at !== null)
  const term = fold(search).trim()
  const searching = term !== ''
  const visible = searching
    ? all.filter((t) => fold(t.description).includes(term))
    : all.filter((t) => matchesView(t, scope, status))
  const scoped = scope === 'income'

  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))
  const byDay = groupsByDay(sort)
  const groups = byDay ? groupByDay(visible, LIST_ORDER) : []
  const flat = byDay ? [] : sortRows(visible, sort, categoryMap)
  const empty = visible.length === 0
  const count = visible.length

  useEffect(() => {
    onVisibleCount?.(count)
  }, [count, onVisibleCount])

  function handleToggle(transaction: Transaction) {
    const nextPaid = transaction.paid_at === null

    togglePaid.mutate({ id: transaction.id, paid: nextPaid })

    // Only the disappearing direction needs recovery. Putting a row back into
    // the list being read is its own confirmation.
    setUndo(nextPaid ? transaction : null)
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3.5 py-3">
        <p className="min-w-0 flex-1 truncate text-sm text-muted">
          {searching ? (
            <>
              <span className="font-semibold text-ink">{visible.length}</span>{' '}
              {visible.length === 1 ? 'resultado' : 'resultados'}
            </>
          ) : scoped ? (
            <>
              <span className="font-semibold text-ink">{visible.length}</span>{' '}
              {visible.length === 1 ? 'receita' : 'receitas'}
            </>
          ) : (
            <>
              <span className="font-semibold text-ink">
                {paid.length} de {all.length}
              </span>{' '}
              {all.length === 1 ? 'lançamento pago' : 'lançamentos pagos'}
            </>
          )}
        </p>

        {scoped ? (
          <ScopeChip label="Receitas" onClear={() => setScope('all')} />
        ) : (
          <StatusToggle status={status} onChange={setStatus} />
        )}
        <NavButton primary icon={PlusIcon} label="Adicionar lançamento" onClick={editor.openNew} />
        <NavButton icon={FilterIcon} label="Ordenar" onClick={() => setFiltering(true)} />
      </div>

      <div>
        {/* Everything that is not the list keeps the page's margins. Only the
            card of rows is allowed to reach the edges, because it is the only
            one that becomes the screen. */}
        <div className="px-3.5">
          {transactions.isPending && (
            <p className="px-1 py-10 text-sm text-muted">Carregando…</p>
          )}

          {transactions.isError && (
            <EmptyState
              title="Não deu para carregar o mês"
              hint="Verifique a conexão e tente de novo."
              action={<Button onClick={() => transactions.refetch()}>Tentar de novo</Button>}
            />
          )}

          {transactions.isSuccess && empty && searching && (
            <EmptyState
              title={`Nada com “${search.trim()}” neste mês`}
              hint="A busca olha o nome de todo lançamento do mês, pago ou não."
            />
          )}

          {transactions.isSuccess && empty && !searching && scoped && (
            <EmptyState
              title="Nenhuma receita neste mês"
              hint="O que entrar aparece aqui, recebido ou não."
              action={<Button onClick={editor.openNew}>Adicionar lançamento</Button>}
            />
          )}

          {transactions.isSuccess && empty && !searching && !scoped && status === 'pending' && (
            <EmptyState
              title="Nada pendente neste mês"
              hint="Tudo que estava marcado já foi pago. Novas contas aparecem aqui."
              action={<Button onClick={editor.openNew}>Adicionar lançamento</Button>}
            />
          )}

          {transactions.isSuccess && empty && !searching && !scoped && status === 'paid' && (
            <EmptyState
              title="Nada pago neste mês"
              hint="O que você marcar como pago aparece aqui."
            />
          )}
        </div>

        {!empty && (
          <div className="list-widening bg-surface px-4 pt-1 pb-4">
            {byDay ? (
              groups.map((group) => (
                <DayGroupSection
                  key={group.date}
                  group={group}
                  categories={categoryMap}
                  onOpen={setSheet}
                />
              ))
            ) : (
              <ul className="pt-3">
                {flat.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    category={
                      transaction.category_id ? categoryMap.get(transaction.category_id) : undefined
                    }
                    onOpen={setSheet}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {filtering && (
        <FilterSheet
          sort={sort}
          onSortChange={setSort}
          onClose={() => setFiltering(false)}
        />
      )}

      {sheet && (
        <TransactionSheet
          transaction={sheet}
          onClose={() => setSheet(null)}
          onTogglePaid={handleToggle}
          onDelete={(transaction, scope) => remove.mutate({ id: transaction.id, scope })}
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
