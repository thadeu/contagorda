import { useNavigate, useParams } from 'react-router'
import { useAccount, useArchiveAccount, useUpdateAccount } from './hooks'
import { AccountForm } from './components/AccountForm'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { centsToInput } from '../transactions/formValues'

export function EditAccountPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const account = useAccount(id)
  const update = useUpdateAccount()
  const archive = useArchiveAccount()

  if (!account) {
    return (
      <EmptyState
        title="Conta não encontrada"
        hint="Ela pode ter sido arquivada."
        action={<Button onClick={() => navigate('/contas')}>Voltar</Button>}
      />
    )
  }

  return (
    <>
      <h1 className="px-4 pt-4 font-display text-xl">Editar conta</h1>

      <AccountForm
        submitLabel="Salvar"
        pending={update.isPending}
        onCancel={() => navigate(-1)}
        initial={{
          name: account.name,
          kind: account.kind,
          institution: account.institution ?? '',
          balance: centsToInput(account.initial_balance_cents),
        }}
        onSubmit={(input) =>
          update.mutate({ id, input }, { onSuccess: () => navigate('/contas') })
        }
        footer={
          <div className="border-t border-hairline pt-6">
            <Button
              type="button"
              variant="danger"
              className="w-full"
              disabled={archive.isPending}
              onClick={() => {
                if (!confirm(`Arquivar "${account.name}"? Os lançamentos dela continuam no histórico.`)) return

                archive.mutate(id, { onSuccess: () => navigate('/contas') })
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
    </>
  )
}
