import type { Account, Category, Transaction } from '@/services/types'
import { monthKey, shiftMonth, todayIso } from '@/lib/dates'

/**
 * Two years of it: January of this year through December of next.
 *
 * Anchored to today rather than written as fixed dates, so the span always
 * contains the current month and the app always opens onto something. Fixed
 * dates make a mock that was true when it was written and quietly empty a year
 * later.
 *
 * Long on purpose. A screen that plots months beside each other cannot be judged
 * on two months of data — the chart has no shape, the arrows never reach an end,
 * and a series that repeats looks the same as one that does not. Most of what is
 * here is recurring, because most of what a household pays is.
 *
 * Ids are real UUIDs rather than "1", "2", "3" — a mock that uses short ids hides
 * layout problems that only appear once a real id is on screen.
 */

/** The one member the fixtures were entered by. */
const SEED_MEMBER = '019fce00-0000-7000-8000-0000000000e1'

const thisMonth = monthKey(todayIso())

/** January of this year, and every month through December of next. */
const firstMonth = `${todayIso().slice(0, 4)}-01`
const months = Array.from({ length: 24 }, (_, index) => shiftMonth(firstMonth, index))

function on(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

/**
 * Accounts written as a table and given ids from one counter.
 *
 * Twenty of them spelled out in full would be a hundred lines in which the only
 * thing that varies is three words a row, and the one detail that must not
 * repeat — the id — would be the one a copy-paste gets wrong.
 */
function more(rows: [string, Account['kind'], string | null][]): Account[] {
  return rows.map(([name, kind, institution], index) => ({
    id: `019fce00-0000-7000-8000-${String(index + 4).padStart(12, '0')}`,
    name,
    kind,
    institution,
    archived_at: null,
  }))
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

  // Twenty more, appended and never inserted: the three above are reached by
  // index for the opening balances and by id for every seeded transaction, so
  // the order of what came first is load-bearing.
  //
  // They are here to make a long list a thing that can be looked at — the
  // picker scrolling, the drag carrying a row past a screenful, two accounts
  // whose names differ only by what is under them. A fixture set of three
  // proves none of that.
  ...more([
    ['Itaú', 'checking', 'Itaú Unibanco'],
    ['Cartão Itaú', 'credit_card', 'Itaú Unibanco'],
    ['Bradesco', 'checking', 'Bradesco'],
    ['Poupança Bradesco', 'savings', 'Bradesco'],
    ['Banco do Brasil', 'checking', 'Banco do Brasil'],
    ['Caixa', 'checking', 'Caixa Econômica'],
    ['Poupança Caixa', 'savings', 'Caixa Econômica'],
    ['Inter', 'checking', 'Banco Inter'],
    ['Cartão Inter', 'credit_card', 'Banco Inter'],
    ['C6', 'checking', 'C6 Bank'],
    ['Cartão C6', 'credit_card', 'C6 Bank'],
    ['PicPay', 'checking', 'PicPay'],
    ['Mercado Pago', 'checking', 'Mercado Pago'],
    ['Cartão Amex', 'credit_card', 'American Express'],
    ['Reserva de emergência', 'savings', 'Nu Pagamentos'],
    ['Tesouro Direto', 'investment', 'Rico'],
    ['Ações', 'investment', 'XP Investimentos'],
    ['Cripto', 'investment', 'Binance'],
    ['Dinheiro do mercado', 'cash', null],
    ['Cofrinho', 'cash', null],
  ]),
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
const SALARY_SERIES = '019fce03-0000-7000-8000-000000000003'
const INTERNET_SERIES = '019fce03-0000-7000-8000-000000000004'
const GYM_SERIES = '019fce03-0000-7000-8000-000000000005'
const INSURANCE_SERIES = '019fce03-0000-7000-8000-000000000006'
const LAPTOP_SERIES = '019fce03-0000-7000-8000-000000000007'
const SCHOOL_SERIES = '019fce03-0000-7000-8000-000000000008'
const CAR_LOAN_SERIES = '019fce03-0000-7000-8000-000000000009'

interface SeriesSpec {
  id: string
  day: number
  kind: Transaction['kind']
  amount: number
  description: string
  category: string | null
  account: string
  /** Where it starts and how far it runs, as offsets into the span. */
  from?: number
  count?: number
  /** Every how many months. Twelve is a yearly bill. */
  every?: number
}

/**
 * Days stay at or below the 28th. The clamp for shorter months is the domain's
 * job and it has its own tests; a fixture that leans on it would report a bug in
 * `occurrences` as a bug on whatever screen happened to show it.
 */
const series: SeriesSpec[] = [
  { id: SALARY_SERIES, day: 5, kind: 'income', amount: 2_450_000, description: 'Salário', category: salario, account: nubank },
  { id: RENT_SERIES, day: 5, kind: 'expense', amount: 520_000, description: 'Aluguel', category: moradia, account: nubank },
  { id: SCHOOL_SERIES, day: 8, kind: 'expense', amount: 342_000, description: 'Escola', category: moradia, account: nubank },
  { id: CAR_LOAN_SERIES, day: 15, kind: 'expense', amount: 289_000, description: 'Financiamento do carro', category: transporte, account: nubank },
  { id: INTERNET_SERIES, day: 28, kind: 'expense', amount: 19_990, description: 'Internet', category: moradia, account: nubank },
  { id: STREAMING_SERIES, day: 18, kind: 'expense', amount: 5_590, description: 'Netflix', category: assinaturas, account: cartao },
  { id: GYM_SERIES, day: 10, kind: 'expense', amount: 25_980, description: 'Academia', category: assinaturas, account: cartao },
  // A yearly one, so the chart has a month that stands out for a reason.
  { id: INSURANCE_SERIES, day: 20, kind: 'expense', amount: 480_000, description: 'Seguro do carro', category: transporte, account: nubank, from: 2, every: 12 },
  // And one that ends: ten instalments, the shape every card statement has.
  { id: LAPTOP_SERIES, day: 12, kind: 'expense', amount: 89_900, description: 'Notebook 10x', category: assinaturas, account: cartao, from: 4, count: 10 },
]

/**
 * The one-offs. Enough of them, and varied enough, that no two months draw the
 * same bar — a chart where every column matches proves nothing about the chart.
 * The amounts move with the index rather than at random so the fixture is the
 * same on every reload, which is what makes a screenshot worth comparing.
 */
const casual: { day: number; amount: number; description: string; category: string | null; account: string }[] = [
  { day: 6, amount: 12_780, description: 'Padaria', category: mercado, account: carteira },
  { day: 8, amount: 18_640, description: 'Almoço', category: restaurante, account: cartao },
  { day: 11, amount: 148_300, description: 'Mercado do mês', category: mercado, account: cartao },
  { day: 14, amount: 26_800, description: 'Farmácia', category: mercado, account: cartao },
  { day: 19, amount: 3_200, description: 'Café', category: restaurante, account: carteira },
  { day: 22, amount: 18_900, description: 'Uber', category: transporte, account: cartao },
  { day: 25, amount: 84_600, description: 'Conta de luz', category: moradia, account: nubank },
]

function spread(index: number, month: number): number {
  return 1 + (((index * 7 + month * 13) % 9) - 4) / 10
}

export const transactions: Transaction[] = [
  ...series.flatMap((rule) =>
    months
      .map((month, index) => ({ month, index }))
      .filter(({ index }) => index >= (rule.from ?? 0))
      .filter(({ index }) => index < (rule.from ?? 0) + (rule.count ?? months.length) * (rule.every ?? 1))
      .filter(({ index }) => (index - (rule.from ?? 0)) % (rule.every ?? 1) === 0)
      .map(({ month }) =>
        tx(month, rule.day, rule.kind, rule.amount, rule.description, rule.category, rule.account, {
          series: rule.id,
        }),
      ),
  ),

  ...months.flatMap((month, monthIndex) =>
    casual
      .filter((_, index) => (index + monthIndex) % 7 !== 0)
      .map((row, index) =>
        tx(
          month,
          row.day,
          'expense',
          Math.round((row.amount * spread(index, monthIndex)) / 10) * 10,
          row.description,
          row.category,
          row.account,
        ),
      ),
  ),

  // The freela lands twice a year and is the only income that is not the salary,
  // which is what stops the income side from being a flat line.
  ...months
    .filter((_, index) => index % 6 === 3)
    .map((month) => tx(month, 14, 'income', 480_000, 'Freela — landing page', freela, nubank)),

  tx(thisMonth, 22, 'expense', 38_900, 'Jantar de aniversário', restaurante, cartao),

  /**
   * The month somebody buys a car, and the only six-figure month here.
   *
   * It earns its place twice over. It is the amount that proves the label gives
   * way to "R$ 118,4 mil" instead of wrapping, and it is the shape a real
   * history has — a flat run of months and then one that dwarfs them. A fixture
   * of evenly-sized months would let a chart that cannot survive an outlier look
   * finished.
   *
   * It also costs something, and that is worth seeing rather than avoiding:
   * every other bar is measured against this one, so they all shrink. A chart
   * scaled to its peak has that property, and the month to find out is now.
   */
  tx(shiftMonth(thisMonth, -3), 9, 'expense', 9_800_000, 'Entrada do carro', transporte, nubank),
]
