import { Link } from 'react-router'
import type { Category, Transaction } from '../../../services/types'
import { Money } from '../../../ui/Money'
import { CheckIcon, RepeatIcon } from '../../../ui/icons'
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
  const overdue = !paid && !isFuture(transaction.date)
  const income = transaction.kind === 'income'

  return (
    <li className="flex items-center gap-3 px-4">
      <Link
        to={`/transacoes/${transaction.id}/editar`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-base"
          aria-hidden="true"
        >
          {category?.icon ?? '•'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-ink">
            {transaction.description}
          </span>
          <span className="flex items-center gap-1.5 truncate text-xs text-faint">
            {category?.name ?? 'Sem categoria'}
            {transaction.recurring_series_id && <RepeatIcon className="size-3" />}
            {overdue && <span className="font-medium text-out">· vencida</span>}
          </span>
        </span>

        <Money
          cents={transaction.amount_cents}
          tone={income ? 'in' : overdue ? 'out' : 'default'}
          className={`shrink-0 text-[0.9375rem] font-semibold ${paid ? 'opacity-45' : ''}`}
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
        className={`grid size-8 shrink-0 place-items-center rounded-full border transition-colors ${
          paid ? 'border-in bg-in text-white' : 'border-line text-transparent hover:border-muted'
        }`}
      >
        <CheckIcon className="size-4" />
      </button>
    </li>
  )
}
