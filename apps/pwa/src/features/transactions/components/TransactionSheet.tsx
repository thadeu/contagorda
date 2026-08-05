import { useNavigate } from 'react-router'
import type { Transaction } from '../../../services/types'
import { formatBRL } from '../../../lib/money'
import { BottomSheet, SheetAction, SheetActionCard } from '../../../ui/BottomSheet'
import { DeleteIcon, EditIcon, PaidIcon, UnpaidIcon } from '../../../ui/icons'

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

  const payLabel = paid ? (income ? 'Não recebida' : 'Não paga') : income ? 'Recebida' : 'Paga'

  return (
    <BottomSheet
      title={transaction.description}
      subtitle={formatBRL(transaction.amount_cents)}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2">
        <SheetActionCard
          label={payLabel}
          icon={paid ? UnpaidIcon : PaidIcon}
          onClick={() => {
            onTogglePaid(transaction)
            onClose()
          }}
        />

        <SheetActionCard
          label="Editar"
          icon={EditIcon}
          onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
        />
      </div>

      <hr className="my-2 border-line" />

      <SheetAction
        danger
        className="flex w-full items-center justify-center gap-2"
        onClick={() => {
          onDelete(transaction)
          onClose()
        }}
      >
        <DeleteIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Excluir
      </SheetAction>
    </BottomSheet>
  )
}
