import { useAccounts } from './hooks'
import { Card } from '../../ui/Card'
import { Money } from '../../ui/Money'

const KIND_LABEL: Record<string, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de crédito',
  cash: 'Dinheiro',
  investment: 'Investimento',
}

export function AccountsPage() {
  const accounts = useAccounts()

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="font-display text-xl">Contas</h1>

      <ul className="grid gap-2 pt-4">
        {(accounts.data ?? []).map((account) => (
          <li key={account.id}>
            <Card className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-text">{account.name}</p>
                <p className="text-xs text-faint">
                  {KIND_LABEL[account.kind]}
                  {account.institution && ` · ${account.institution}`}
                </p>
              </div>
              <Money cents={account.initial_balance_cents} className="text-sm" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
