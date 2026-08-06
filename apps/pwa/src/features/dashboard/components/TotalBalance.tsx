import { Money } from '../../../ui/Money'
import { useAccounts, useOpeningBalances } from '../../accounts/hooks'
import { useTransactions } from '../../transactions/hooks'
import { balanceFor } from '../../accounts/accountBalance'

/**
 * Three, never more.
 *
 * The stack is decoration in a card that is already sharing a row, and a fourth
 * face pushes the whole run into the text beside it — which is the layout
 * breaking, not merely looking busy. The count underneath is what says how many
 * accounts there really are; the pile only has to read as "several".
 */
const MAX_FACES = 3

/** Mock card faces. Real ones would come from the account's institution. */
const FACES = [
  'from-[#f0475f] to-[#f5a25d]',
  'from-[#2f7cf6] to-[#4fb0f7]',
  'from-[#7b5cf0] to-[#b06cf5]',
]

/**
 * What is actually there, across every account.
 *
 * Deliberately not the headline. The reference puts total balance at the top
 * because it is a banking app, and a bank's job is to tell you what you have.
 * This one exists to say what is still owed, so the stack above keeps the big
 * number and this sits beside it — a second opinion rather than the answer.
 *
 * The cards run off the right edge on purpose: a row that ends inside the screen
 * looks like all there is, and one that leaves says there is more without
 * spending a control to say so.
 *
 * The two circles and the dots are what makes a coloured rectangle read as a
 * card at a glance — the shape alone reads as a swatch. The digits stay dots
 * even once these are real: the last four of a card number is the sort of thing
 * that ends up in a screenshot, and it buys nothing here that the colour and the
 * account name do not already say.
 */
export function TotalBalance({ month }: { month: string }) {
  const accounts = useAccounts()
  const opening = useOpeningBalances(month)
  const transactions = useTransactions(month)

  const rows = transactions.data ?? []
  const list = accounts.data ?? []

  const totalCents = list.reduce(
    (total, account) => total + balanceFor(account.id, opening.data?.[account.id] ?? 0, rows),
    0,
  )

  return (
    <section className="relative h-full overflow-hidden rounded-card bg-surface px-4 py-3.5">
      <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
        Saldo total
      </p>

      <Money cents={totalCents} className="block pt-1 text-xl font-bold text-ink" />

      <p className="max-w-[45%] pt-0.5 text-xs text-muted">
        {list.length === 1 ? '1 conta' : `${list.length} contas`}
      </p>

      <div className="pointer-events-none absolute -right-1 bottom-3 flex" aria-hidden="true">
        {list.slice(0, MAX_FACES).map((account, index) => (
          <div
            key={account.id}
            style={{ marginLeft: index === 0 ? 0 : '-2.5rem', zIndex: index }}
            className={`relative h-11 w-[3.5rem] rounded-lg bg-gradient-to-br ${FACES[index]}`}
          >
            <span className="absolute top-1.5 left-1.5 flex">
              <span className="size-2 rounded-full bg-white/75" />
              <span className="-ml-0.5 size-2 rounded-full bg-white/35" />
            </span>

            <span className="absolute bottom-1.5 left-1.5 text-[0.375rem] font-bold tracking-[0.12em] text-white/90">
              •• ••••
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
