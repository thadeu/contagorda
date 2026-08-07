import { useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '@/app/useMonth'
import { monthLabel } from '@/lib/dates'
import { Button } from '@/ui/Button'
import { Modal } from '@/ui/Modal'
import { ConfirmSheet } from '@/ui/ConfirmSheet'
import { centsToInput } from '@/features/transactions/formValues'
import { AccountForm } from './components/AccountForm'
import { AccountEditorContext, type AccountEditor } from './accountEditorContext'
import {
  useAccount,
  useArchiveAccount,
  useCreateAccount,
  useOpeningBalances,
  useSetOpeningBalance,
  useUpdateAccount,
} from './hooks'

type Editing = { mode: 'new' } | { mode: 'edit'; id: string } | null

/**
 * The same shape as the transaction editor, for the same reason: adding an
 * account is a short task that ends where it started, and the list it belongs to
 * should stay visible behind it.
 */
export function AccountEditorProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<Editing>(null)

  const editor = useMemo<AccountEditor>(
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
    <AccountEditorContext value={editor}>
      {children}

      {editing?.mode === 'new' && <NewAccountModal onClose={close} />}
      {editing?.mode === 'edit' && <EditAccountModal id={editing.id} onClose={close} />}
    </AccountEditorContext>
  )
}

function NewAccountModal({ onClose }: { onClose: () => void }) {
  const { month } = useMonth()
  const create = useCreateAccount()
  const setOpening = useSetOpeningBalance(month)

  return (
    <Modal title="Nova conta" onClose={onClose}>
      <AccountForm
        submitLabel="Salvar"
        pending={create.isPending || setOpening.isPending}
        balanceLabel={`Saldo no início de ${monthLabel(month)}`}
        onSubmit={(input, openingCents) => {
          create.mutate(input, {
            onSuccess: (account) =>
              setOpening.mutate({ accountId: account.id, cents: openingCents }, { onSuccess: onClose }),
          })
        }}
      />
    </Modal>
  )
}

function EditAccountModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [archiving, setArchiving] = useState(false)
  const { month } = useMonth()
  const account = useAccount(id)
  const opening = useOpeningBalances(month)
  const update = useUpdateAccount()
  const setOpening = useSetOpeningBalance(month)
  const archive = useArchiveAccount()

  if (!account) {
    return null
  }

  return (
    <Modal title="Editar conta" onClose={onClose}>
      <AccountForm
        submitLabel="Salvar"
        pending={update.isPending || setOpening.isPending}
        balanceLabel={`Saldo no início de ${monthLabel(month)}`}
        initial={{
          name: account.name,
          kind: account.kind,
          institution: account.institution ?? '',
          balance: centsToInput(opening.data?.[id] ?? 0),
        }}
        onSubmit={(input, openingCents) => {
          update.mutate(
            { id, input },
            {
              onSuccess: () =>
                setOpening.mutate({ accountId: id, cents: openingCents }, { onSuccess: onClose }),
            },
          )
        }}
        footer={
          <div className="mt-6 rounded-card bg-surface p-4">
            <p className="text-xs leading-relaxed text-muted">
              Arquivar tira a conta das listas e dos formulários. Os lançamentos dela continuam no
              histórico, com a conta onde aconteceram.
            </p>

            <Button
              type="button"
              variant="danger"
              className="mt-3 w-full"
              disabled={archive.isPending}
              onClick={() => setArchiving(true)}
            >
              Arquivar conta
            </Button>
          </div>
        }
      />

      {archiving && (
        <ConfirmSheet
          danger
          title={`Arquivar ${account.name}?`}
          message="Ela sai das listas e dos formulários. Os lançamentos dela continuam no histórico, com a conta onde aconteceram."
          confirmLabel="Arquivar"
          pending={archive.isPending}
          onClose={() => setArchiving(false)}
          onConfirm={() => archive.mutate(id, { onSuccess: onClose })}
        />
      )}
    </Modal>
  )
}
