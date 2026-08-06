import type { Category, Transaction } from '../../../services/types'
import { Money } from '../../../ui/Money'
import { RepeatIcon } from '../../../ui/icons'
import { isFuture } from '../../../lib/dates'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
  onOpen: (transaction: Transaction) => void
}

/**
 * The row carries no horizontal padding of its own. Whatever holds it — the
 * card on the month view, the docked sheet on the statistics screen — is already
 * inset, and a row that pads itself again lands three indents from the edge of
 * the screen while the surface it sits on lands at one.
 *
 * The whole row is one target, and it opens a sheet rather than acting.
 *
 * There is no paid checkbox: the list is already filtered by status, so every
 * row under "A pagar" is pending and every row under "Pago" is paid. A per-row
 * marker would restate what the tab just said, while taking width from the
 * description — the part that actually gets read.
 */
export function TransactionRow({ transaction, category, onOpen }: TransactionRowProps) {
  const paid = transaction.paid_at !== null
  const overdue = !paid && !isFuture(transaction.date)
  const income = transaction.kind === 'income'

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(transaction)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sunken text-base"
          aria-hidden="true"
        >
          {category?.icon ?? '•'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-ink">
            {transaction.description}
          </span>
          <span className="flex items-center gap-1.5 truncate text-xs text-muted">
            {category?.name ?? 'Sem categoria'}
            {transaction.recurring_series_id && <RepeatIcon className="size-3" />}
            {overdue && <span className="font-medium text-out">· vencida</span>}
          </span>
        </span>

        <Money
          cents={transaction.amount_cents}
          tone={income ? 'in' : overdue ? 'out' : 'default'}
          className="shrink-0 text-[0.9375rem] font-semibold"
        />
      </button>
    </li>
  )
}
