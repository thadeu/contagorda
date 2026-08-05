import { useLocation, useNavigate } from 'react-router'
import { NavBar, NavButton } from '../../ui/NavBar'
import { useAccounts, useOpeningBalances } from './hooks'
import { useAccountEditor } from './accountEditorContext'
import { kindLabel } from './accountKinds'
import { useMonth } from '../../app/useMonth'
import { monthLabel } from '../../lib/dates'
import { useTransactions } from '../transactions/hooks'
import { Card } from '../../ui/Card'
import { Money } from '../../ui/Money'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'
import { useDocumentCanvas } from '../../ui/useDocumentCanvas'
import { balanceFor } from './accountBalance'

export function AccountsPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { month } = useMonth()
  const accounts = useAccounts()
  const opening = useOpeningBalances(month)
  const transactions = useTransactions(month)
  const editor = useAccountEditor()

  useDocumentCanvas('dusk')

  const rows = transactions.data ?? []

  return (
    <>
      <NavBar
        topInset
        title="Contas"
        leading={
          <NavButton
            icon={ChevronLeftIcon}
            label="Voltar"
            onClick={() => navigate({ pathname: '/', search })}
          />
        }
        trailing={<NavButton primary icon={PlusIcon} label="Nova conta" onClick={editor.openNew} />}
      />

      <p className="px-4 pb-3 text-sm text-ink/70 first-letter:uppercase">{monthLabel(month)}</p>

      {accounts.isSuccess && accounts.data.length === 0 && (
        <EmptyState
          title="Nenhuma conta ainda"
          hint="Cadastre onde o dinheiro entra e sai para começar a lançar."
          action={<Button onClick={editor.openNew}>Cadastrar conta</Button>}
        />
      )}

      <ul className="grid gap-2 px-4">
        {(accounts.data ?? []).map((account) => {
          const startCents = opening.data?.[account.id] ?? 0

          return (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => editor.openEdit(account.id)}
                className="block w-full text-left"
              >
                <Card className="flex items-center justify-between gap-3 px-4 py-3">
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
                </Card>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

