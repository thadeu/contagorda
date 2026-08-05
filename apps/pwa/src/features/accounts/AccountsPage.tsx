import { useNavigate } from 'react-router'
import { NavBar, NavButton } from '../../ui/NavBar'
import { useAccounts } from './hooks'
import { useAccountEditor } from './accountEditorContext'
import { kindLabel } from './accountKinds'
import { Card } from '../../ui/Card'
import { Money } from '../../ui/Money'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'

export function AccountsPage() {
  const accounts = useAccounts()
  const editor = useAccountEditor()
  const navigate = useNavigate()

  return (
    <>
      <NavBar
        topInset
        title="Contas"
        leading={
          <NavButton icon={ChevronLeftIcon} label="Voltar" onClick={() => navigate('/')} />
        }
        trailing={<NavButton primary icon={PlusIcon} label="Nova conta" onClick={editor.openNew} />}
      />

      {accounts.isSuccess && accounts.data.length === 0 && (
        <EmptyState
          title="Nenhuma conta ainda"
          hint="Cadastre onde o dinheiro entra e sai para começar a lançar."
          action={<Button onClick={editor.openNew}>Cadastrar conta</Button>}
        />
      )}

      <ul className="grid gap-2 px-4 pt-2">
        {(accounts.data ?? []).map((account) => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => editor.openEdit(account.id)}
              className="block w-full text-left"
            >
              <Card className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-medium text-ink">{account.name}</p>
                  <p className="truncate text-xs text-muted">
                    {kindLabel(account.kind)}
                    {account.institution && ` · ${account.institution}`}
                  </p>
                </div>

                <Money
                  cents={account.initial_balance_cents}
                  className="shrink-0 text-[0.9375rem] font-semibold"
                />
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
