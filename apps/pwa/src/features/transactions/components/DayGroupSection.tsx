import type { Category, Transaction } from '../../../services/types'
import type { DayGroup } from '../groupByDay'
import { dayLabel, isToday } from '../../../lib/dates'
import { Money } from '../../../ui/Money'
import { Card } from '../../../ui/Card'
import { TransactionRow } from './TransactionRow'

interface DayGroupSectionProps {
  group: DayGroup
  categories: Map<string, Category>
  onTogglePaid: (transaction: Transaction) => void
}

export function DayGroupSection({ group, categories, onTogglePaid }: DayGroupSectionProps) {
  const today = isToday(group.date)

  return (
    <section className="pt-4">
      <header className="flex items-baseline justify-between px-1 pb-2">
        <h3 className={`text-xs font-semibold tracking-wide uppercase ${today ? 'text-in' : 'text-faint'}`}>
          {today ? 'Hoje' : dayLabel(group.date)}
        </h3>
        <Money cents={Math.abs(group.netCents)} tone="muted" className="text-xs" />
      </header>

      <Card>
        <ul className="divide-y divide-line">
          {group.transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              category={transaction.category_id ? categories.get(transaction.category_id) : undefined}
              onTogglePaid={onTogglePaid}
            />
          ))}
        </ul>
      </Card>
    </section>
  )
}
