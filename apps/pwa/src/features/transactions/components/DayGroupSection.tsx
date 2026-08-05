import type { Category, Transaction } from '../../../services/types'
import type { DayGroup } from '../groupByDay'
import { dayLabel, isToday } from '../../../lib/dates'
import { Money } from '../../../ui/Money'
import { DaySpine } from './DaySpine'
import { TransactionRow } from './TransactionRow'

interface DayGroupSectionProps {
  group: DayGroup
  peakCents: number
  categories: Map<string, Category>
  onTogglePaid: (transaction: Transaction) => void
}

export function DayGroupSection({ group, peakCents, categories, onTogglePaid }: DayGroupSectionProps) {
  const today = isToday(group.date)

  return (
    <section className="px-4">
      <header className="flex items-baseline gap-3 pt-4 pb-1">
        <h3
          className={`shrink-0 font-mono text-xs tracking-wide uppercase ${
            today ? 'text-amber' : 'text-faint'
          }`}
        >
          {dayLabel(group.date)}
        </h3>

        <div className="flex-1">
          <DaySpine netCents={group.netCents} peakCents={peakCents} today={today} />
        </div>

        <Money cents={group.netCents} signed className="shrink-0 text-xs opacity-80" />
      </header>

      <ul className="divide-y divide-hairline/60">
        {group.transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            category={transaction.category_id ? categories.get(transaction.category_id) : undefined}
            onTogglePaid={onTogglePaid}
          />
        ))}
      </ul>
    </section>
  )
}
