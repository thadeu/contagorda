import { useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '../../app/useMonth'
import { Modal } from '../../ui/Modal'
import { centsToInput } from './formValues'
import { TransactionForm } from './components/TransactionForm'
import {
  TransactionEditorContext,
  type TransactionEditor,
} from './transactionEditorContext'
import {
  useResolveCategory,
  useTransaction,
  useUpdateTransaction,
  useCreateTransaction,
} from './hooks'

type Editing = { mode: 'new' } | { mode: 'edit'; id: string } | null

export function TransactionEditorProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<Editing>(null)

  const editor = useMemo<TransactionEditor>(
    () => ({
      openNew: () => setEditing({ mode: 'new' }),
      openEdit: (id) => setEditing({ mode: 'edit', id }),
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
      {editing?.mode === 'edit' && <EditTransactionModal id={editing.id} onClose={close} />}
    </TransactionEditorContext>
  )
}

function NewTransactionModal({ onClose }: { onClose: () => void }) {
  const { month } = useMonth()
  const create = useCreateTransaction(month)
  const resolveCategory = useResolveCategory()

  return (
    <Modal title="Novo lançamento" onClose={onClose}>
      <TransactionForm
        submitLabel="Salvar"
        pending={create.isPending}
        onSubmit={async (input, custom) => {
          const categoryId = custom ? await resolveCategory(custom, input.kind) : input.category_id

          create.mutate({ ...input, category_id: categoryId }, { onSuccess: onClose })
        }}
      />
    </Modal>
  )
}

function EditTransactionModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { month } = useMonth()
  const transaction = useTransaction(month, id)
  const update = useUpdateTransaction(month)
  const resolveCategory = useResolveCategory()

  if (!transaction) {
    return null
  }

  return (
    <Modal title="Editar lançamento" onClose={onClose}>
      <TransactionForm
        submitLabel="Salvar"
        pending={update.isPending}
        initial={{
          kind: transaction.kind,
          amount: centsToInput(transaction.amount_cents),
          description: transaction.description,
          date: transaction.date,
          accountId: transaction.account_id,
          categoryId: transaction.category_id ?? '',
          customCategory: '',
          paid: transaction.paid_at !== null,
        }}
        onSubmit={async (input, custom) => {
          const categoryId = custom ? await resolveCategory(custom, input.kind) : input.category_id

          update.mutate({ id, input: { ...input, category_id: categoryId } }, { onSuccess: onClose })
        }}
      />
    </Modal>
  )
}
