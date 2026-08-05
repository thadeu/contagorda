import { useNavigate } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useCreateTransaction, useResolveCategory } from './hooks'
import { TransactionForm } from './components/TransactionForm'
import { ScreenHeader } from '../../ui/ScreenHeader'

export function NewTransactionPage() {
  const navigate = useNavigate()
  const { month } = useMonth()
  const create = useCreateTransaction(month)
  const resolveCategory = useResolveCategory()

  return (
    <>
      <ScreenHeader title="Novo lançamento" />

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
