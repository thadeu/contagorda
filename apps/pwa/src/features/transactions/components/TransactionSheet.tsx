import { useNavigate } from 'react-router'
import type { Transaction } from '../../../services/types'
import { formatBRL } from '../../../lib/money'
import { BottomSheet, SheetAction } from '../../../ui/BottomSheet'

interface TransactionSheetProps {
  transaction: Transaction
  onClose: () => void
  onTogglePaid: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

// Action labels say what will happen, not what is true now: a control that reads
// as a status leaves you guessing which way it will move.
export function TransactionSheet({
  transaction,
  onClose,
  onTogglePaid,
  onDelete,
}: TransactionSheetProps) {
  const navigate = useNavigate()
  const paid = transaction.paid_at !== null
  const income = transaction.kind === 'income'

  const payLabel = paid
    ? income
      ? 'Não recebida'
      : 'Não paga'
    : income
      ? 'Recebida'
      : 'Paga'

  return (
    <BottomSheet
      title={transaction.description}
      subtitle={formatBRL(transaction.amount_cents)}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2">
        <SheetAction
          onClick={() => {
            onTogglePaid(transaction)
            onClose()
          }}
        >
          {payLabel}
        </SheetAction>

        <SheetAction onClick={() => navigate(`/transacoes/${transaction.id}/editar`)}>
          Editar
        </SheetAction>
      </div>

      <hr className="my-2 border-line" />

      <SheetAction
        danger
        className="w-full"
        onClick={() => {
          onDelete(transaction)
          onClose()
        }}
      >
        Excluir
      </SheetAction>
    </BottomSheet>
  )
}
