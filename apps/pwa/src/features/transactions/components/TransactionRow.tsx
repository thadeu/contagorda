import { Link } from 'react-router'
import type { Category, Transaction } from '../../../services/types'
import { Money } from '../../../ui/Money'
import { isFuture } from '../../../lib/dates'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
  onTogglePaid: (transaction: Transaction) => void
}

// The row body opens the editor while the check stays a separate target.
// Merging them would make correcting an amount and marking it paid the same
// gesture, and one of those destroys the list you are reading.
export function TransactionRow({ transaction, category, onTogglePaid }: TransactionRowProps) {
  const paid = transaction.paid_at !== null
  const upcoming = !paid && isFuture(transaction.date)
  const overdue = !paid && !upcoming

  return (
    <li className="flex items-center gap-3">
      <Link
        to={`/transacoes/${transaction.id}/editar`}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5"
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline bg-sunken text-base"
          aria-hidden="true"
        >
          {category?.icon ?? '•'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-text">{transaction.description}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-faint">
            {category?.name ?? 'Sem categoria'}
            {transaction.recurring_series_id && <span title="Recorrente">↻</span>}
            {overdue && <span className="text-out">· vencida</span>}
            {upcoming && <span className="text-muted">· a pagar</span>}
          </span>
        </span>

        <Money
          cents={transaction.kind === 'income' ? transaction.amount_cents : -transaction.amount_cents}
          signed
          className={`shrink-0 text-sm ${paid ? '' : 'opacity-55'}`}
        />
      </Link>

      <button
        type="button"
        onClick={() => onTogglePaid(transaction)}
        aria-pressed={paid}
        aria-label={
          paid
            ? `Marcar ${transaction.description} como não paga`
            : `Marcar ${transaction.description} como paga`
        }
        className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs transition-colors ${
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
