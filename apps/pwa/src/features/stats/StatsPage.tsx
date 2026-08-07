import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { NavBar, NavButton } from '@/ui/NavBar'
import { DockedSheet } from '@/ui/DockedSheet'
import { Money } from '@/ui/Money'
import { EmptyState } from '@/ui/EmptyState'
import { Spinner } from '@/ui/Spinner'
import { ChevronLeftIcon, ChevronRightIcon, MoreIcon, TargetIcon } from '@/ui/icons'
import { useDocumentCanvas } from '@/ui/useDocumentCanvas'
import { monthKey, monthLabel, shiftMonth, todayIso } from '@/lib/dates'
import { useMonth } from '@/app/useMonth'
import { useCategories } from '@/features/accounts/hooks'
import {
  useDeleteTransaction,
  useMonthlyTotals,
  useTogglePaid,
  useTransactions,
} from '@/features/transactions/hooks'
import { groupByDay } from '@/features/transactions/groupByDay'
import { DayGroupSection } from '@/features/transactions/components/DayGroupSection'
import { TransactionSheet } from '@/features/transactions/components/TransactionSheet'
import { MonthBars } from './components/MonthBars'
import { MonthDifference } from './components/MonthDifference'
import { difference, read } from './trend'
import { ALL, CategoryFilter, UNCATEGORISED } from './components/CategoryFilter'
import type { Transaction } from '@/services/types'

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
 * Nothing on this screen gives way to a finger except the two things that
 * should: the chart pans sideways, the sheet moves up and down. Everywhere else
 * declares `touch-action: none`, which is what stops the whole page rubber-
 * banding under a drag that landed on a heading — the page has nowhere to go, so
 * the only thing that motion can express is that the app is not a native one.
 *
 * Declared per block rather than once at the root, because `touch-action`
 * intersects down the tree: `none` on the page would reach the sheet's list and
 * silently take its scrolling with it. The spacer at the bottom of the column
 * exists for the same reason — it covers the strip of page the chart does not
 * reach, and a rule that cannot be hung on an ancestor has to be hung on
 * something.
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
  /**
   * Anything on screen that is not the month it claims to be. The two queries
   * are asked separately and land separately, and a spinner that came back for
   * the second one after leaving for the first would read as a stutter.
   */
  const busy = transactions.isFetching || totals.isFetching
  const gap = difference(read(bars, monthKey(todayIso())), month)
  const oldest = bars[0]?.month ?? month
  const newest = bars[bars.length - 1]?.month ?? monthKey(todayIso())

  return (
    <div className="relative h-full overflow-hidden overscroll-none bg-deep">
      <div className="flex h-full flex-col">
        <div className="touch-none">
          <NavBar
            topInset
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

              {/* Between the two steps, because it is the third way to move along
                  the same line — and the only one that does not depend on where
                  you already are. Six months out, going back costs six taps or a
                  scroll through the chart to find the month you started on. */}
              <NavButton
                icon={TargetIcon}
                label="Ir para o mês atual"
                disabled={month === monthKey(todayIso())}
                onClick={() => setMonth(monthKey(todayIso()))}
              />

              <NavButton
                icon={ChevronRightIcon}
                label="Próximo mês"
                disabled={month >= newest}
                onClick={() => setMonth(shiftMonth(month, 1))}
              />
            </div>
          </div>

          {/* The figure keeps the month it had until the new one arrives, and
              the spinner is what stops that from being a lie. A blank here, or a
              zero, would both be worse: R$ 0,00 is a real answer — a month with
              nothing spent — and the app would be stating it with a straight
              face on the way to something else. */}
          <p className="flex items-center gap-2.5 px-4 pb-4 text-[2rem] leading-tight font-bold text-ink">
            {transactions.data ? <Money cents={totalCents} /> : <span className="opacity-0">—</span>}

            {busy && <Spinner />}
          </p>
        </div>

        {/* The one horizontal gesture on the screen, and the only place a finger
            moves anything other than the sheet. */}
        <div className="pb-3">
          <MonthBars totals={bars} selected={month} onSelect={setMonth} />
        </div>

        {gap && (
          <div className="touch-none pb-4">
            <MonthDifference gap={gap} />
          </div>
        )}

        <div aria-hidden="true" className="flex-1 touch-none" />
      </div>

      <DockedSheet
        expanded={expanded}
        onExpandedChange={setExpanded}
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
