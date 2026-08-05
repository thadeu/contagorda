import { useNavigate } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useCreateTransaction, useResolveCategory } from './hooks'
import { TransactionForm } from './components/TransactionForm'

export function NewTransactionPage() {
  const navigate = useNavigate()
  const { month } = useMonth()
  const create = useCreateTransaction(month)
  const resolveCategory = useResolveCategory()

  return (
    <>
      <h1 className="px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 text-[1.75rem] font-semibold tracking-tight">Novo lançamento</h1>

      <TransactionForm
        submitLabel="Salvar"
        pending={create.isPending}
        onCancel={() => navigate(-1)}
        onSubmit={async (input, custom) => {
          const categoryId = custom ? await resolveCategory(custom, input.kind) : input.category_id

          create.mutate({ ...input, category_id: categoryId }, { onSuccess: () => navigate(-1) })
        }}
      />
    </>
  )
}
