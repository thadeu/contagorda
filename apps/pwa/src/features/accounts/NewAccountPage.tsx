import { useNavigate } from 'react-router'
import { useCreateAccount } from './hooks'
import { AccountForm } from './components/AccountForm'

export function NewAccountPage() {
  const navigate = useNavigate()
  const create = useCreateAccount()

  return (
    <>
      <h1 className="px-4 pt-4 font-display text-xl">Nova conta</h1>

      <AccountForm
        submitLabel="Salvar"
        pending={create.isPending}
        onCancel={() => navigate(-1)}
        onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate('/contas') })}
      />
    </>
  )
}
