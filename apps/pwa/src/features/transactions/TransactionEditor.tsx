import { useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '@/app/useMonth'
import type { Scope } from '@/services/ports'
import type { Recurrence } from './recurrence'
import { Modal } from '@/ui/Modal'
import type { Direction } from '@/services/types'
import { NavAction } from '@/ui/NavBar'
import { centsToInput } from './formValues'
import { TransactionForm } from './components/TransactionForm'
import {
  TransactionEditorContext,
  type TransactionEditor,
} from './transactionEditorContext'
import {
  useTransaction,
  useUpdateTransaction,
  useCreateTransaction,
  useRepeatTransaction,
} from './hooks'

type Editing = { mode: 'new' } | { mode: 'edit'; id: string; scope: Scope } | null

/**
 * Only one editor is ever mounted, so one id is enough — and it has to be a
 * constant rather than generated, because the submit button in the nav bar finds
 * the form by name across the DOM.
 */
const FORM_ID = 'transaction-form'

export function TransactionEditorProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<Editing>(null)

  const editor = useMemo<TransactionEditor>(
    () => ({
      openNew: () => setEditing({ mode: 'new' }),
      openEdit: (id, scope = 'one') => setEditing({ mode: 'edit', id, scope }),
    }),
    [],
  )

  function close() {
    setEditing(null)
  }

  return (
    <TransactionEditorContext value={editor}>
      {children}

      {editing?.mode === 'new' && <NewTransactionModal onClose={close} />}
      {editing?.mode === 'edit' && (
        <EditTransactionModal id={editing.id} scope={editing.scope} onClose={close} />
      )}
    </TransactionEditorContext>
  )
}

function NewTransactionModal({ onClose }: { onClose: () => void }) {
  const { month } = useMonth()
  const create = useCreateTransaction(month)
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null)

  /**
   * Expense, always, until the switch says otherwise. Nearly every entry is one,
   * and a form that opened on whatever was entered last would make the most
   * common case depend on history nobody remembers.
   */
  const [kind, setKind] = useState<Direction>('expense')

  return (
    <Modal
      title={`Nova ${noun(kind)}`}
      onClose={onClose}
      trailing={
        <NavAction type="submit" form={FORM_ID} label="Salvar" disabled={create.isPending} />
      }
    >
      <TransactionForm
        id={FORM_ID}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
        onKindChange={setKind}
        onSubmit={(input) => create.mutate({ input, recurrence }, { onSuccess: onClose })}
      />
    </Modal>
  )
}

function EditTransactionModal({
  id,
  scope,
  onClose,
}: {
  id: string
  scope: Scope
  onClose: () => void
}) {
  const { month } = useMonth()
  const transaction = useTransaction(month, id)
  const update = useUpdateTransaction(month)
  const repeat = useRepeatTransaction(month)
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null)
  const [kind, setKind] = useState<Direction | null>(null)

  if (!transaction) {
    return null
  }

  return (
    <Modal
      title={`Editar ${noun(kind ?? transaction.kind)}`}
      onClose={onClose}
      trailing={
        <NavAction type="submit" form={FORM_ID} label="Salvar" disabled={update.isPending} />
      }
    >
      <TransactionForm
        id={FORM_ID}
        authorId={transaction.created_by_id}
        onKindChange={setKind}
        initial={{
          kind: transaction.kind,
          amount: centsToInput(transaction.amount_cents),
          description: transaction.description,
          date: transaction.date,
          accountId: transaction.account_id,
          categoryId: transaction.category_id ?? '',
          paid: transaction.paid_at !== null,
        }}
        /*
         * A row that belongs to no series can become the first of one. A row
         * already in a series cannot have its rule rewritten here — the
         * occurrences around it would have to move, and the scope choice is how
         * those are reached.
         */
        recurrence={transaction.recurring_series_id === null ? recurrence : undefined}
        onRecurrenceChange={
          transaction.recurring_series_id === null ? setRecurrence : undefined
        }
        onSubmit={(input) =>
          update.mutate(
            { id, input, scope },
            {
              onSuccess: () => {
                if (recurrence) {
                  repeat.mutate({ id, recurrence }, { onSuccess: onClose })

                  return
                }

                onClose()
              },
            },
          )
        }
      />
    </Modal>
  )
}

/**
 * What the panel calls what is being entered.
 *
 * The heading follows the switch rather than staying "lançamento", because the
 * direction is the one field somebody can set wrongly and never notice — the
 * amount, the date and the description all read the same either way, and a
 * receipt filed as income is only found when a month refuses to add up. A title
 * that changes under the finger is the cheapest possible confirmation.
 */
function noun(kind: Direction): string {
  return kind === 'expense' ? 'Despesa' : 'Receita'
}
