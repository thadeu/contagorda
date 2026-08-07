import type { Account, Category, Transaction } from '../types'
import { monthKey, shiftMonth, todayIso } from '../../lib/dates'

/**
 * Fixtures are anchored to the current month so the app always opens with
 * something to look at, and so "previous month" is never empty. Ids are real
 * UUIDs rather than "1", "2", "3" — a mock that uses short ids hides layout
 * problems that only appear once a real id is on screen.
 */

/** The one member the fixtures were entered by. */
const SEED_MEMBER = '019fce00-0000-7000-8000-0000000000e1'

const thisMonth = monthKey(todayIso())
const lastMonth = shiftMonth(thisMonth, -1)

function on(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

export const accounts: Account[] = [
  {
    id: '019fce00-0000-7000-8000-000000000001',
    name: 'Nubank',
    kind: 'checking',
    institution: 'Nu Pagamentos',
    archived_at: null,
  },
  {
    id: '019fce00-0000-7000-8000-000000000002',
    name: 'Cartão Nubank',
    kind: 'credit_card',
    institution: 'Nu Pagamentos',
    archived_at: null,
  },
  {
    id: '019fce00-0000-7000-8000-000000000003',
    name: 'Carteira',
    kind: 'cash',
    institution: null,
    archived_at: null,
  },
]

export const categories: Category[] = [
  { id: '019fce01-0000-7000-8000-000000000001', name: 'Moradia', kind: 'expense', icon: '🏠', color: null },
  { id: '019fce01-0000-7000-8000-000000000002', name: 'Mercado', kind: 'expense', icon: '🛒', color: null },
  { id: '019fce01-0000-7000-8000-000000000003', name: 'Transporte', kind: 'expense', icon: '🚗', color: null },
  { id: '019fce01-0000-7000-8000-000000000004', name: 'Assinaturas', kind: 'expense', icon: '📺', color: null },
  { id: '019fce01-0000-7000-8000-000000000005', name: 'Restaurante', kind: 'expense', icon: '🍽️', color: null },
  { id: '019fce01-0000-7000-8000-000000000006', name: 'Salário', kind: 'income', icon: '💼', color: null },
  { id: '019fce01-0000-7000-8000-000000000007', name: 'Freela', kind: 'income', icon: '💻', color: null },
]

const [nubank, cartao, carteira] = accounts.map((a) => a.id)
const [moradia, mercado, transporte, assinaturas, restaurante, salario, freela] = categories.map((c) => c.id)

let seq = 0

function tx(
  month: string,
  day: number,
  kind: Transaction['kind'],
  amount: number,
  description: string,
  category: string | null,
  account: string,
  options: { paid?: boolean; series?: string | null } = {},
): Transaction {
  seq += 1
  const date = on(month, day)
  const paid = options.paid ?? date <= todayIso()

  return {
    id: `019fce02-0000-7000-8000-${String(seq).padStart(12, '0')}`,
    account_id: account,
    category_id: category,
    kind,
    amount_cents: amount,
    date,
    description,
    paid_at: paid ? `${date}T12:00:00Z` : null,
    recurring_series_id: options.series ?? null,
    created_by_id: SEED_MEMBER,
    detached: false,
  }
}

const RENT_SERIES = '019fce03-0000-7000-8000-000000000001'
const STREAMING_SERIES = '019fce03-0000-7000-8000-000000000002'

export const transactions: Transaction[] = [
  tx(lastMonth, 5, 'income', 780_000, 'Salário', salario, nubank),
  tx(lastMonth, 5, 'expense', 210_000, 'Aluguel', moradia, nubank, { series: RENT_SERIES }),
  tx(lastMonth, 12, 'expense', 34_590, 'Mercado do mês', mercado, cartao),
  tx(lastMonth, 18, 'expense', 5_590, 'Netflix', assinaturas, cartao, { series: STREAMING_SERIES }),
  tx(lastMonth, 22, 'expense', 8_900, 'Uber', transporte, cartao),

  tx(thisMonth, 5, 'income', 780_000, 'Salário', salario, nubank),
  tx(thisMonth, 5, 'expense', 210_000, 'Aluguel', moradia, nubank, { series: RENT_SERIES }),
  tx(thisMonth, 6, 'expense', 12_780, 'Padaria', mercado, carteira),
  tx(thisMonth, 8, 'expense', 4_290, 'Uber para o centro', transporte, cartao),
  tx(thisMonth, 8, 'expense', 8_640, 'Almoço', restaurante, cartao),
  tx(thisMonth, 11, 'expense', 41_230, 'Mercado do mês', mercado, cartao),
  tx(thisMonth, 14, 'income', 150_000, 'Freela — landing page', freela, nubank),
  tx(thisMonth, 14, 'expense', 6_800, 'Farmácia', mercado, cartao),
  tx(thisMonth, 18, 'expense', 5_590, 'Netflix', assinaturas, cartao, { series: STREAMING_SERIES }),
  tx(thisMonth, 19, 'expense', 3_200, 'Café', restaurante, carteira),
  tx(thisMonth, 22, 'expense', 18_900, 'Jantar de aniversário', restaurante, cartao),
  tx(thisMonth, 25, 'expense', 29_900, 'Conta de luz', moradia, nubank, { paid: false }),
  tx(thisMonth, 28, 'expense', 13_990, 'Internet', moradia, nubank, { paid: false }),
]
