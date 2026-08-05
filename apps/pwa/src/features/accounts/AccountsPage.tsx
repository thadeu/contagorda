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
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold tracking-tight">Contas</h1>
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
              <Card className="flex items-center justify-between px-4 py-3 transition-colors ">
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-medium text-ink">{account.name}</p>
                  <p className="truncate text-xs text-muted">
                    {kindLabel(account.kind)}
                    {account.institution && ` · ${account.institution}`}
                  </p>
                </div>
                <Money cents={account.initial_balance_cents} className="shrink-0 text-[0.9375rem] font-semibold" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
