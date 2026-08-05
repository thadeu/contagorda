import type { Category, Transaction } from '../../../services/types'
import { Money } from '../../../ui/Money'
import { isFuture } from '../../../lib/dates'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
  onTogglePaid: (transaction: Transaction) => void
}

export function TransactionRow({ transaction, category, onTogglePaid }: TransactionRowProps) {
  const paid = transaction.paid_at !== null
  const upcoming = !paid && isFuture(transaction.date)
  const overdue = !paid && !upcoming

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline bg-sunken text-base"
        aria-hidden="true"
      >
        {category?.icon ?? '•'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">{transaction.description}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-faint">
          {category?.name ?? 'Sem categoria'}
          {transaction.recurring_series_id && <span title="Recorrente">↻</span>}
          {overdue && <span className="text-out">· vencida</span>}
          {upcoming && <span className="text-muted">· a pagar</span>}
        </p>
      </div>

      <Money
        cents={transaction.kind === 'income' ? transaction.amount_cents : -transaction.amount_cents}
        signed
        className={`shrink-0 text-sm ${paid ? '' : 'opacity-55'}`}
      />

      <button
        type="button"
        onClick={() => onTogglePaid(transaction)}
        aria-pressed={paid}
        aria-label={paid ? `Marcar ${transaction.description} como não paga` : `Marcar ${transaction.description} como paga`}
        className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs transition-colors ${
          paid
            ? 'border-in-dim bg-in-dim/25 text-in'
            : 'border-hairline text-faint hover:border-hairline-strong'
        }`}
      >
        ✓
      </button>
    </li>
  )
}
