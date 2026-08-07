import { useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '../../app/useMonth'
import type { Scope } from '../../services/ports'
import type { Recurrence } from './recurrence'
import { Modal } from '../../ui/Modal'
import { NavButton } from '../../ui/NavBar'
import { CheckIcon } from '../../ui/icons'
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

  return (
    <Modal
      title="Novo lançamento"
      onClose={onClose}
      trailing={
        <NavButton
          type="submit"
          form={FORM_ID}
          icon={CheckIcon}
          label="Salvar"
          disabled={create.isPending}
        />
      }
    >
      <TransactionForm
        id={FORM_ID}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
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

  if (!transaction) {
    return null
  }

  return (
    <Modal
      title="Editar lançamento"
      onClose={onClose}
      trailing={
        <NavButton
          type="submit"
          form={FORM_ID}
          icon={CheckIcon}
          label="Salvar"
          disabled={update.isPending}
        />
      }
    >
      <TransactionForm
        id={FORM_ID}
        authorId={transaction.created_by_id}
        initial={{
          kind: transaction.kind,
          amount: centsToInput(transaction.amount_cents),
          description: transaction.description,
          date: transaction.date,
          accountId: transaction.account_id,
          categoryId: transaction.category_id ?? '',
          paid: transaction.paid_at !== null,
        }}
        onSubmit={(input) => update.mutate({ id, input, scope }, { onSuccess: onClose })}
      />
    </Modal>
  )
}
