import type { AccountKind } from '../../services/types'

export const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'investment', label: 'Investimento' },
]

export function kindLabel(kind: AccountKind): string {
  return ACCOUNT_KINDS.find((k) => k.value === kind)?.label ?? kind
}
