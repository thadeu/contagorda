import { beforeEach, describe, expect, it } from 'vitest'
import { createMockServices } from './index'

const services = createMockServices()

async function series(rows: number) {
  const first = await services.transactions.create(
    {
      account_id: 'a',
      category_id: null,
      kind: 'expense',
      amount_cents: 100_000,
      date: '2026-08-10',
      description: 'Aluguel',
      paid: true,
    },
    { frequency: 'monthly', interval: 1, repeats: rows - 1 },
  )

  return first
}

function rowsOf(seriesId: string | null) {
  return services.transactions
    .monthlyTotals()
    .then(() => Promise.all(['2026-08', '2026-09', '2026-10', '2026-11'].map(monthRows)))
    .then((months) => months.flat().filter((row) => row.recurring_series_id === seriesId))
}

function monthRows(month: string) {
  return services.transactions.listByMonth(month)
}

beforeEach(async () => {
  const [ledger] = await services.ledgers.list()

  expect(ledger).toBeDefined()
})

describe('creating a series', () => {
  it('writes one row per occurrence', async () => {
    const first = await series(4)
    const rows = await rowsOf(first.recurring_series_id)

    expect(rows).toHaveLength(4)
    expect(rows.map((row) => row.date)).toEqual([
      '2026-08-10',
      '2026-09-10',
      '2026-10-10',
      '2026-11-10',
    ])
  })

  /**
   * A future row marked paid is a claim about a month nobody has lived through.
   * Only the one being entered can already be settled.
   */
  it('settles only the first one, however the form was filled', async () => {
    const first = await series(3)
    const rows = await rowsOf(first.recurring_series_id)

    expect(rows[0].paid_at).not.toBeNull()
    expect(rows.slice(1).every((row) => row.paid_at === null)).toBe(true)
  })
})

describe('editing', () => {
  it('reaches the ones after it, and leaves the past alone', async () => {
    const first = await series(4)
    const rows = await rowsOf(first.recurring_series_id)
    const september = rows[1]

    await services.transactions.update(september.id, { amount_cents: 150_000 }, 'future')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.amount_cents)).toEqual([100_000, 150_000, 150_000, 150_000])
  })

  it('changes only one when that is what was asked', async () => {
    const first = await series(3)
    const rows = await rowsOf(first.recurring_series_id)

    await services.transactions.update(rows[1].id, { amount_cents: 200_000 }, 'one')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.amount_cents)).toEqual([100_000, 200_000, 100_000])
  })

  /**
   * Someone who corrected one month did it knowing it differed. A later change
   * to the series must not quietly undo that.
   */
  it('leaves a row that was already corrected on its own', async () => {
    const first = await series(4)
    const rows = await rowsOf(first.recurring_series_id)

    await services.transactions.update(rows[2].id, { amount_cents: 999_000 }, 'one')
    await services.transactions.update(rows[0].id, { amount_cents: 120_000 }, 'future')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.amount_cents)).toEqual([120_000, 120_000, 999_000, 120_000])
  })

  it('never moves another occurrence onto this one date', async () => {
    const first = await series(3)
    const rows = await rowsOf(first.recurring_series_id)

    await services.transactions.update(rows[0].id, { date: '2026-08-15' }, 'future')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.date)).toEqual(['2026-08-15', '2026-09-10', '2026-10-10'])
  })
})

describe('deleting', () => {
  it('takes the ones after it and keeps the history', async () => {
    const first = await series(4)
    const rows = await rowsOf(first.recurring_series_id)

    await services.transactions.remove(rows[1].id, 'future')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.date)).toEqual(['2026-08-10'])
  })

  it('takes only one when that is what was asked', async () => {
    const first = await series(3)
    const rows = await rowsOf(first.recurring_series_id)

    await services.transactions.remove(rows[1].id, 'one')

    const after = await rowsOf(first.recurring_series_id)

    expect(after.map((row) => row.date)).toEqual(['2026-08-10', '2026-10-10'])
  })
})

describe('making an existing row repeat', () => {
  async function single() {
    return services.transactions.create({
      account_id: 'a',
      category_id: null,
      kind: 'expense',
      amount_cents: 42_000,
      date: '2026-08-10',
      description: 'Internet',
      paid: false,
    })
  }

  it('writes what comes after it and leaves the row where it was', async () => {
    const row = await single()

    await services.transactions.repeat(row.id, { frequency: 'monthly', interval: 1, repeats: 2 })

    const after = await services.transactions.listByMonth('2026-08')
    const first = after.find((t) => t.id === row.id)

    expect(first?.recurring_series_id).not.toBeNull()
    expect(first?.date).toBe('2026-08-10')

    const rows = await rowsOf(first?.recurring_series_id ?? null)

    expect(rows.map((r) => r.date)).toEqual(['2026-08-10', '2026-09-10', '2026-10-10'])
  })

  /**
   * The row keeps whatever it was; what follows has not happened yet. Same rule
   * as a series created from scratch, where only the first can be settled.
   */
  it('leaves the new ones unpaid', async () => {
    const row = await single()

    await services.transactions.repeat(row.id, { frequency: 'monthly', interval: 1, repeats: 2 })

    const rows = await rowsOf((await services.transactions.listByMonth('2026-08')).find((t) => t.id === row.id)?.recurring_series_id ?? null)

    expect(rows.slice(1).every((r) => r.paid_at === null)).toBe(true)
  })

  it('refuses a row that already belongs to a series', async () => {
    const first = await series(3)
    const before = await rowsOf(first.recurring_series_id)

    await services.transactions.repeat(first.id, { frequency: 'monthly', interval: 1, repeats: 5 })

    const after = await rowsOf(first.recurring_series_id)

    expect(after).toHaveLength(before.length)
  })
})
