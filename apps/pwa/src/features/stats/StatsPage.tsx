import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { NavBar, NavButton } from '../../ui/NavBar'
import { DockedSheet } from '../../ui/DockedSheet'
import { Money } from '../../ui/Money'
import { EmptyState } from '../../ui/EmptyState'
import { ChevronLeftIcon, ChevronRightIcon, MoreIcon } from '../../ui/icons'
import { useDocumentCanvas } from '../../ui/useDocumentCanvas'
import { useHideOnScroll } from '../../ui/useHideOnScroll'
import { monthKey, monthLabel, shiftMonth, todayIso } from '../../lib/dates'
import { useMonth } from '../../app/useMonth'
import { useCategories } from '../accounts/hooks'
import {
  useDeleteTransaction,
  useMonthlyTotals,
  useTogglePaid,
  useTransactions,
} from '../transactions/hooks'
import { groupByDay } from '../transactions/groupByDay'
import { DayGroupSection } from '../transactions/components/DayGroupSection'
import { TransactionSheet } from '../transactions/components/TransactionSheet'
import { MonthBars } from './components/MonthBars'
import { ALL, CategoryFilter, UNCATEGORISED } from './components/CategoryFilter'
import type { Transaction } from '../../services/types'

/**
 * The history behind the month.
 *
 * The dashboard answers for one month; this answers what that month looks like
 * beside every other one. Same data, different question, so it is a screen
 * rather than a card that grew.
 *
 * The month chosen here is the month chosen everywhere — it lives in the query
 * string, so going back leaves the dashboard on whatever the chart landed on.
 * Picking August here and returning to July would have the two screens arguing
 * about which month you are looking at.
 *
 * Choosing a category narrows everything at once — the chart, the figure and
 * the list — because they are three views of one answer and a filter that moved
 * only the list would leave the other two contradicting it.
 *
 * The chips are built from the unfiltered month, so choosing one never removes
 * the way back to the others.
 *
 * The page does not scroll, and the sheet rests on top of it already open. It is
 * one screen with a panel on it rather than two blocks sharing the height —
 * splitting it read as two screens stacked, and left the chart without the room
 * to be a chart.
 */
export function StatsPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { month, setMonth } = useMonth()

  const transactions = useTransactions(month)
  const categories = useCategories()
  const togglePaid = useTogglePaid(month)
  const remove = useDeleteTransaction(month)

  const [expanded, setExpanded] = useState(false)
  const [category, setCategory] = useState<string | null>(ALL)

  const totals = useMonthlyTotals(category)
  const [open, setOpen] = useState<Transaction | null>(null)

  useDocumentCanvas('deep')

  /**
   * The list inside the sheet is the only thing on this screen that scrolls, so
   * it is what the bar listens to. Pulling rows up folds the bar away and gives
   * the height to the rows; the first push back down returns it.
   */
  const list = useHideOnScroll<HTMLDivElement>()

  const expenses = (transactions.data ?? []).filter((row) => row.kind === 'expense')
  const shown =
    category === ALL
      ? expenses
      : expenses.filter((row) => (row.category_id ?? UNCATEGORISED) === category)

  const totalCents = shown.reduce((total, row) => total + row.amount_cents, 0)
  const groups = groupByDay(shown, 'desc')
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c]))
  /**
   * Both arrows stay on screen and grey out at the ends. A control that vanishes
   * moves everything beside it and leaves nothing to explain why — greyed out
   * says "this is the edge", which is the answer someone is looking for.
   */
  const bars = totals.data ?? []
  const oldest = bars[0]?.month ?? month
  const newest = bars[bars.length - 1]?.month ?? monthKey(todayIso())

  return (
    <div className="relative h-full overflow-hidden overscroll-none bg-deep">
      <NavBar
        topInset
        hidden={list.hidden}
        title="Despesas"
        leading={
          <NavButton
            icon={ChevronLeftIcon}
            label="Voltar"
            onClick={() => navigate({ pathname: '/', search })}
          />
        }
        trailing={
          <NavButton disabled icon={MoreIcon} label="Mais opções" onClick={() => {}} />
        }
      />

      <div className="flex items-center justify-between gap-3 px-4 pb-2">
        <p className="truncate text-[0.9375rem] font-semibold tracking-wide text-ink uppercase">
          {monthLabel(month)}
        </p>

        <div className="flex shrink-0 gap-1.5">
          <NavButton
            icon={ChevronLeftIcon}
            label="Mês anterior"
            disabled={month <= oldest}
            onClick={() => setMonth(shiftMonth(month, -1))}
          />

          <NavButton
            icon={ChevronRightIcon}
            label="Próximo mês"
            disabled={month >= newest}
            onClick={() => setMonth(shiftMonth(month, 1))}
          />
        </div>
      </div>

      <Money cents={totalCents} className="block px-4 pb-4 text-[2rem] font-bold text-ink" />

      <div className="pb-4">
        <MonthBars totals={bars} selected={month} onSelect={setMonth} />
      </div>

      <DockedSheet
        expanded={expanded}
        onExpandedChange={setExpanded}
        scrollRef={list.ref}
        toolbar={
          <CategoryFilter
            rows={expenses}
            categories={categoryMap}
            selected={category}
            onSelect={setCategory}
          />
        }
      >
        {groups.length === 0 ? (
          <EmptyState title="Nada neste mês" hint="Escolha outro mês no gráfico." />
        ) : (
          groups.map((group) => (
            <DayGroupSection
              key={group.date}
              group={group}
              categories={categoryMap}
              onOpen={setOpen}
            />
          ))
        )}
      </DockedSheet>

      {open && (
        <TransactionSheet
          transaction={open}
          onClose={() => setOpen(null)}
          onTogglePaid={(t) => togglePaid.mutate({ id: t.id, paid: t.paid_at === null })}
          onDelete={(t, scope) => remove.mutate({ id: t.id, scope })}
        />
      )}
    </div>
  )
}
