import { useNavigate, useParams } from 'react-router'
import { useMonth } from '../../app/useMonth'
import {
  useDeleteTransaction,
  useResolveCategory,
  useTransaction,
  useUpdateTransaction,
} from './hooks'
import { TransactionForm } from './components/TransactionForm'
import { centsToInput } from './formValues'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'

export function EditTransactionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { month } = useMonth()

  const transaction = useTransaction(month, id)
  const update = useUpdateTransaction(month)
  const remove = useDeleteTransaction(month)
  const resolveCategory = useResolveCategory()

  if (!transaction) {
    return (
      <EmptyState
        title="Lançamento não encontrado"
        hint="Ele pode ter sido apagado ou estar em outro mês."
        action={<Button onClick={() => navigate('/')}>Voltar</Button>}
      />
    )
  }

  return (
    <>
      <h1 className="px-4 pt-4 font-display text-xl">Editar lançamento</h1>

      <TransactionForm
        submitLabel="Salvar"
        pending={update.isPending}
        onCancel={() => navigate(-1)}
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

          update.mutate(
            { id, input: { ...input, category_id: categoryId } },
            { onSuccess: () => navigate(-1) },
          )
        }}
        footer={
          <div className="border-t border-hairline pt-6">
            <Button
              type="button"
              variant="danger"
              className="w-full"
              disabled={remove.isPending}
              onClick={() => {
                if (!confirm(`Apagar "${transaction.description}"?`)) return

                remove.mutate(id, { onSuccess: () => navigate('/') })
              }}
            >
              Apagar lançamento
            </Button>
          </div>
        }
      />
    </>
  )
}
