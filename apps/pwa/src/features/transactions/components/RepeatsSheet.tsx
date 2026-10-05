import { BottomSheet } from '@/ui/BottomSheet'
import { CheckIcon } from '@/ui/icons'
import { monthKey, monthLabel, type IsoDate } from '@/lib/dates'
import { occurrences, type Frequency } from '@/features/transactions/recurrence'

interface RepeatsSheetProps {
  date: IsoDate
  frequency: Frequency
  interval: number
  value: number
  onSelect: (repeats: number) => void
  onClose: () => void
}

/**
 * Two years, and no further: twenty-four rows at most, this one included.
 *
 * A bill that outlives this is rarer than the cost of supporting it: when the
 * last one arrives, whoever is still paying extends it or starts another, and
 * that is a decision made with two years of hindsight instead of a guess made
 * today. The alternative is an unbounded series, which means either materialising
 * forever or inventing a rule about when to stop that nobody asked for.
 */
const MAX = 24

/**
 * The list counts rows, this one included, and says so in the label: "14 meses"
 * is fourteen entries, ending in the thirteenth month after this one.
 *
 * The rule underneath counts repeats *after* this one, and the two differ by
 * one. Showing that number made "14" write fifteen rows — the label read as a
 * total and the value was an increment — so the conversion lives here, at the
 * edge, and nothing past this sheet sees a count.
 */
/**
 * Every option with the month it lands on.
 *
 * The number was a field, and a field asks a question in a unit nobody thinks
 * in: "how many months" is arithmetic, "until when" is the actual question, and
 * the answer to the second is what someone is trying to reach by guessing at the
 * first. Showing both makes the list the calculation.
 *
 * It also retires the keyboard, and with it every re-render, focus and caret
 * problem that a live numeric input brought — which is the sort of trade where
 * the interface improves and the code gets smaller at the same time.
 */
export function RepeatsSheet({
  date,
  frequency,
  interval,
  value,
  onSelect,
  onClose,
}: RepeatsSheetProps) {
  const counts = Array.from({ length: MAX - 1 }, (_, index) => index + 2)

  return (
    <BottomSheet title="Se repete por" onClose={onClose} expandable>
      <ul className="px-1">
        {counts.map((count) => {
          const repeats = count - 1
          const dates = occurrences(date, { frequency, interval, repeats })
          const last = dates[dates.length - 1]

          return (
            <li key={repeats}>
              <button
                type="button"
                onClick={() => {
                  onSelect(repeats)
                  onClose()
                }}
                aria-pressed={repeats === value}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control px-3 text-left"
              >
                <span className="text-[0.9375rem] text-ink">
                  {count} {unit(frequency, count)}
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-sm text-muted first-letter:uppercase">
                    {monthLabel(monthKey(last))}
                  </span>

                  {repeats === value && <CheckIcon className="size-4 shrink-0 text-accent" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}

function unit(frequency: Frequency, count: number): string {
  if (frequency === 'yearly') return count === 1 ? 'ano' : 'anos'

  return count === 1 ? 'mês' : 'meses'
}
