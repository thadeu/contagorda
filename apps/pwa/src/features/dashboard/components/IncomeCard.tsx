import { Money } from '@/ui/Money'
import { useTransactions } from '@/features/transactions/hooks'
import { useStatusFilter } from '@/features/transactions/useStatusFilter'

/**
 * What came in this month, and how much of it has actually landed.
 *
 * It sits where the total balance used to. A balance is a bank's answer; here
 * the question is whether the month closes, and for that the two figures that
 * matter are what arrives and what leaves. This is the first of the pair, so it
 * takes the left, where reading starts.
 *
 * The bar underneath is the share already received. Unlike the expense bar it
 * has one colour: income is rarely more than a few lines, and slicing it by
 * category would be a chart of two things.
 *
 * Pressing it turns the list below into the income. The list is the bills by
 * default, so this is the only way to see a salary as a row and tick it as
 * received; pressing again hands the list back to the expenses. A solid green
 * edge says which state it is in, since the card looks the same otherwise.
 */
export function IncomeCard({ month }: { month: string }) {
  const transactions = useTransactions(month)
  const { kind, toggleKind } = useStatusFilter()
  const active = kind === 'income'

  const rows = (transactions.data ?? []).filter((t) => t.kind === 'income')
  const totalCents = rows.reduce((total, row) => total + row.amount_cents, 0)
  const receivedCents = rows
    .filter((row) => row.paid_at !== null)
    .reduce((total, row) => total + row.amount_cents, 0)

  const share = totalCents === 0 ? 0 : Math.min(receivedCents / totalCents, 1)

  return (
    <button
      type="button"
      onClick={toggleKind}
      aria-pressed={active}
      aria-label={active ? 'Voltar para as despesas' : 'Mostrar só as receitas'}
      className={`card-shadow h-full w-full rounded-card border bg-surface px-4 py-3.5 text-left transition-colors ${
        active ? 'border-in' : 'border-line'
      }`}
    >
      <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
        Receitas
      </p>

      <p className="truncate pt-0.5 text-xs text-muted">
        {rows.length === 0 ? 'Nenhuma entrada' : rows.length === 1 ? '1 entrada' : `${rows.length} entradas`}
      </p>

      <Money cents={totalCents} tone="in" className="block pt-1 text-xl font-bold" />

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        <span className="block h-full rounded-full bg-in" style={{ width: `${share * 100}%` }} />
      </div>

      <p className="truncate pt-2 text-xs text-muted">
        {totalCents === 0 ? 'Sem previsão' : `${Math.round(share * 100)}% recebido`}
      </p>
    </button>
  )
}
