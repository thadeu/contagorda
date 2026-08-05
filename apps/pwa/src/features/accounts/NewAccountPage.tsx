import { useNavigate } from 'react-router'
import { useCreateAccount } from './hooks'
import { AccountForm } from './components/AccountForm'
import { ScreenHeader } from '../../ui/ScreenHeader'

export function NewAccountPage() {
  const navigate = useNavigate()
  const create = useCreateAccount()

  return (
    <>
      <ScreenHeader title="Nova conta" />

      <AccountForm
        submitLabel="Salvar"
        pending={create.isPending}
        onCancel={() => navigate(-1)}
        onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate('/accounts') })}
      />
    </>
  )
}
