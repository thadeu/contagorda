import { useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '@/app/useMonth'
import type { Scope } from '@/services/ports'
import { recurrenceFrom, sameRecurrence, type Recurrence } from './recurrence'
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
  useRescheduleTransaction,
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
  const create = useCreateTransaction()
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

      <SaveError error={create.error} />
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
  const update = useUpdateTransaction()
  const repeat = useRepeatTransaction()
  const reschedule = useRescheduleTransaction()

  /**
   * What the series does now, when this edit reaches the ones after it.
   *
   * Only then. "Only this one" has no business with a rule that governs the
   * rows around it, and showing the control there would invite a change the
   * save could not honour. Null for a row that repeats nothing, which is the
   * case where the picker offers to start a series instead.
   */
  const current =
    transaction && transaction.recurrence && scope === 'future'
      ? recurrenceFrom(transaction.date, transaction.recurrence)
      : null

  /**
   * Undefined until the person touches it, and then what they chose — null
   * included, which is "switched off". Starting from `current` in the state
   * itself would freeze whatever it was on the first render, and the row can
   * arrive after that.
   */
  const [chosen, setChosen] = useState<Recurrence | null | undefined>(undefined)
  const recurrence = chosen === undefined ? current : chosen
  const [kind, setKind] = useState<Direction | null>(null)

  if (!transaction) {
    return null
  }

  const inSeries = transaction.recurring_series_id !== null
  const editsRule = inSeries && scope === 'future'

  /**
   * Switching the repeat off on a series is not "no series": the rows around it
   * exist. It ends the series here, which is a rule of zero repeats.
   */
  const next: Recurrence | null =
    editsRule && current && recurrence === null ? { ...current, repeats: 0 } : recurrence

  function save(input: Parameters<typeof update.mutate>[0]['input']) {
    update.mutate(
      { id, input, scope },
      {
        onSuccess: () => {
          if (editsRule && next && !sameRecurrence(next, current)) {
            reschedule.mutate({ id, recurrence: next }, { onSuccess: onClose })

            return
          }

          if (!inSeries && recurrence) {
            repeat.mutate({ id, recurrence }, { onSuccess: onClose })

            return
          }

          onClose()
        },
      },
    )
  }

  return (
    <Modal
      title={`Editar ${noun(kind ?? transaction.kind)}`}
      onClose={onClose}
      trailing={
        <NavAction
          type="submit"
          form={FORM_ID}
          label="Salvar"
          disabled={update.isPending || reschedule.isPending}
        />
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
         * A row that belongs to no series can become the first of one. A row in
         * a series can have its rule changed from here onward, when the edit
         * reaches the ones after it; on its own it has no say over them.
         */
        recurrence={!inSeries || editsRule ? recurrence : undefined}
        onRecurrenceChange={!inSeries || editsRule ? setChosen : undefined}
        onSubmit={save}
      />

      <SaveError error={update.error ?? reschedule.error ?? repeat.error} />
    </Modal>
  )
}

/**
 * Why a save did not work, in the server's own words.
 *
 * Nothing said so before: a refused save closed nothing and explained nothing,
 * and the form just sat there. The message arrives already in Portuguese.
 */
function SaveError({ error }: { error: Error | null }) {
  if (!error) return null

  return (
    <p role="alert" className="px-4 pb-6 text-sm font-medium text-out">
      {error.message}
    </p>
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
