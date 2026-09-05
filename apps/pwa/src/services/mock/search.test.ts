import { describe, expect, it } from 'vitest'
import { createMockServices } from './index'

/**
 * The mock has to answer a search the way the API does: accents and case set
 * aside, any month, any status, newest first — or the bar behaves one way with
 * `VITE_USE_MOCK` and another against Rails.
 */
describe('search', () => {
  it('matches inside the description, ignoring accents and case', async () => {
    const services = createMockServices()
    const account = (await services.accounts.list())[0]

    await services.transactions.create({
      account_id: account.id,
      category_id: null,
      kind: 'expense',
      amount_cents: 100,
      date: '2026-01-05',
      description: 'Farmácia São João',
      paid: false,
    })

    const rows = await services.transactions.search('farmacia sao')

    expect(rows.map((r) => r.description)).toContain('Farmácia São João')
  })

  it('answers nothing for a blank term', async () => {
    const services = createMockServices()

    expect(await services.transactions.search('  ')).toEqual([])
  })

  it('puts the newest first', async () => {
    const services = createMockServices()
    const rows = await services.transactions.search('a')
    const dates = rows.map((r) => r.date)

    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))
  })
})
