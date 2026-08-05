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

  return (
    <BottomSheet
      title={transaction.description}
      subtitle={formatBRL(transaction.amount_cents)}
      onClose={onClose}
    >
      <SheetAction
        onClick={() => {
          onTogglePaid(transaction)
          onClose()
        }}
      >
        {paid
          ? income
            ? 'Marcar como não recebida'
            : 'Marcar como não paga'
          : income
            ? 'Marcar como recebida'
            : 'Marcar como paga'}
      </SheetAction>

      <SheetAction onClick={() => navigate(`/transacoes/${transaction.id}/editar`)}>
        Editar
      </SheetAction>

      <SheetAction
        danger
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
