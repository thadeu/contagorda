import { Link } from 'react-router'
import { useAccounts } from './hooks'
import { kindLabel } from './accountKinds'
import { Card } from '../../ui/Card'
import { Money } from '../../ui/Money'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'

export function AccountsPage() {
  const accounts = useAccounts()

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl">Contas</h1>
        <Link to="/contas/nova">
          <Button variant="ghost">Nova conta</Button>
        </Link>
      </div>

      {accounts.isSuccess && accounts.data.length === 0 && (
        <EmptyState
          title="Nenhuma conta ainda"
          hint="Cadastre onde o dinheiro entra e sai para começar a lançar."
          action={
            <Link to="/contas/nova">
              <Button>Cadastrar conta</Button>
            </Link>
          }
        />
      )}

      <ul className="grid gap-2 pt-4">
        {(accounts.data ?? []).map((account) => (
          <li key={account.id}>
            <Link to={`/contas/${account.id}/editar`}>
              <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:border-hairline-strong">
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{account.name}</p>
                  <p className="truncate text-xs text-faint">
                    {kindLabel(account.kind)}
                    {account.institution && ` · ${account.institution}`}
                  </p>
                </div>
                <Money cents={account.initial_balance_cents} className="shrink-0 text-sm" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
