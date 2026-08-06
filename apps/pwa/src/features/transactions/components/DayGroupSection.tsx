import type { Category, Transaction } from '../../../services/types'
import type { DayGroup } from '../groupByDay'
import { dayLabel, isToday } from '../../../lib/dates'
import { Money } from '../../../ui/Money'
import { TransactionRow } from './TransactionRow'

interface DayGroupSectionProps {
  group: DayGroup
  categories: Map<string, Category>
  onOpen: (transaction: Transaction) => void
}

/**
 * A day, flat on whatever surface it is placed on.
 *
 * The rows used to sit in a card of their own, one per day, which turned a month
 * into a stack of small boxes and put a border between every day. Placing the
 * whole list on one surface instead lets the date headings do the separating —
 * which is what a heading is for.
 */
export function DayGroupSection({ group, categories, onOpen }: DayGroupSectionProps) {
  const today = isToday(group.date)

  return (
    <section className="pt-4">
      <header className="flex items-baseline justify-between pb-2">
        <h3 className={`text-xs font-semibold tracking-wide uppercase ${today ? 'text-in' : 'text-faint'}`}>
          {today ? 'Hoje' : dayLabel(group.date)}
        </h3>
        <Money cents={Math.abs(group.netCents)} tone="muted" className="text-xs" />
      </header>

      <ul>
        {group.transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            category={transaction.category_id ? categories.get(transaction.category_id) : undefined}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </section>
  )
}
