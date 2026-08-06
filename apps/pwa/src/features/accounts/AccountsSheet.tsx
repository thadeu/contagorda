import { Modal } from '../../ui/Modal'
import { NavButton } from '../../ui/NavBar'
import { useAccounts, useOpeningBalances } from './hooks'
import { useAccountEditor } from './accountEditorContext'
import { kindLabel } from './accountKinds'
import { useMonth } from '../../app/useMonth'
import { monthLabel } from '../../lib/dates'
import { useTransactions } from '../transactions/hooks'
import { Money } from '../../ui/Money'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { PlusIcon } from '../../ui/icons'
import { balanceFor } from './accountBalance'

/**
 * Accounts, presented rather than travelled to.
 *
 * It was a screen with a back button, which made it somewhere you go — but you
 * do not go to accounts, you glance at them and return to the month you were
 * reading. A sheet says that: the month stays behind it, and closing puts you
 * back exactly where you were rather than navigating you there.
 *
 * The form opens over this one, and the confirm over that. Three deep is not a
 * mistake here — each is a smaller question about the thing underneath it, and
 * closing one answers it and leaves the rest standing.
 */
export function AccountsSheet({ onClose }: { onClose: () => void }) {
  const { month } = useMonth()
  const accounts = useAccounts()
  const opening = useOpeningBalances(month)
  const transactions = useTransactions(month)
  const editor = useAccountEditor()

  const rows = transactions.data ?? []
  const list = accounts.data ?? []

  return (
    <Modal
      title="Contas"
      onClose={onClose}
      trailing={<NavButton primary icon={PlusIcon} label="Nova conta" onClick={editor.openNew} />}
    >
      <p className="px-4 pb-3 text-sm text-muted first-letter:uppercase">{monthLabel(month)}</p>

      {accounts.isSuccess && list.length === 0 && (
        <EmptyState
          title="Nenhuma conta ainda"
          hint="Cadastre onde o dinheiro entra e sai para começar a lançar."
          action={<Button onClick={editor.openNew}>Cadastrar conta</Button>}
        />
      )}

      {list.length > 0 && (
        <ul className="mx-4 divide-y divide-line rounded-card bg-surface px-4">
          {list.map((account) => {
            const startCents = opening.data?.[account.id] ?? 0

            return (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => editor.openEdit(account.id)}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-medium text-ink">{account.name}</p>
                    <p className="truncate text-xs text-muted">
                      {kindLabel(account.kind)}
                      {account.institution && ` · ${account.institution}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <Money
                      cents={balanceFor(account.id, startCents, rows)}
                      className="text-[0.9375rem] font-semibold"
                    />
                    <p className="text-xs text-muted">
                      Início <Money cents={startCents} />
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
