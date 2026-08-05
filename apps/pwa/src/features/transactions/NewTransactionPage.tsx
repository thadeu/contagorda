import { useNavigate } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useCreateTransaction } from './hooks'
import { TransactionForm } from './components/TransactionForm'

export function NewTransactionPage() {
  const navigate = useNavigate()
  const { month } = useMonth()
  const create = useCreateTransaction(month)

  return (
    <>
      <h1 className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)] font-display text-xl">
        Novo lançamento
      </h1>

      <TransactionForm
        submitLabel="Salvar"
        pending={create.isPending}
        onCancel={() => navigate(-1)}
        onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate(-1) })}
      />
    </>
  )
}
