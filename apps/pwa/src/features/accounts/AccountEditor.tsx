import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { centsToInput } from '../transactions/formValues'
import { AccountForm } from './components/AccountForm'
import { AccountEditorContext, type AccountEditor } from './accountEditorContext'
import { useAccount, useArchiveAccount, useCreateAccount, useUpdateAccount } from './hooks'

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
  const create = useCreateAccount()

  return (
    <Modal title="Nova conta" onClose={onClose}>
      <AccountForm
        submitLabel="Salvar"
        pending={create.isPending}
        onSubmit={(input) => create.mutate(input, { onSuccess: onClose })}
      />
    </Modal>
  )
}

function EditAccountModal({ id, onClose }: { id: string; onClose: () => void }) {
  const account = useAccount(id)
  const update = useUpdateAccount()
  const archive = useArchiveAccount()

  if (!account) {
    return null
  }

  return (
    <Modal title="Editar conta" onClose={onClose}>
      <AccountForm
        submitLabel="Salvar"
        pending={update.isPending}
        initial={{
          name: account.name,
          kind: account.kind,
          institution: account.institution ?? '',
          balance: centsToInput(account.initial_balance_cents),
        }}
        onSubmit={(input) => update.mutate({ id, input }, { onSuccess: onClose })}
        footer={
          <div className="pt-4">
            <Button
              type="button"
              variant="danger"
              className="w-full"
              disabled={archive.isPending}
              onClick={() => {
                if (!confirm(`Arquivar "${account.name}"? Os lançamentos dela continuam no histórico.`)) {
                  return
                }

                archive.mutate(id, { onSuccess: onClose })
              }}
            >
              Arquivar conta
            </Button>
            <p className="pt-2 text-center text-xs text-faint">
              Arquivar tira a conta das listas e mantém o histórico.
            </p>
          </div>
        }
      />
    </Modal>
  )
}
