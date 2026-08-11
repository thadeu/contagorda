import { describe, expect, it } from 'vitest'
import { createMockServices } from './index'

/**
 * The mock has to answer a reorder the way the API does, or the fixtures become
 * a second set of rules — and a drag that behaves one way with `VITE_USE_MOCK`
 * and another against Rails is a bug found twice.
 */
describe('reorder', () => {
  it('returns the accounts in the order it was given', async () => {
    const services = createMockServices()
    const before = await services.accounts.list()
    const reversed = [...before].reverse().map((a) => a.id)

    const after = await services.accounts.reorder(reversed)

    expect(after.map((a) => a.id)).toEqual(reversed)
    expect(await services.accounts.list().then((list) => list.map((a) => a.id))).toEqual(reversed)
  })

  // A payload that names only part of the list must not drop the rest.
  it('keeps accounts it was never told about', async () => {
    const services = createMockServices()
    const before = await services.accounts.list()
    const last = before[before.length - 1]

    const after = await services.accounts.reorder([last.id])

    expect(after[0].id).toBe(last.id)
    expect(after).toHaveLength(before.length)
  })

  // The fixtures build most of their ids from a counter, and an id that repeats
  // is a React key that repeats — two rows that drag as one.
  it('gives every account an id of its own', async () => {
    const services = createMockServices()
    const list = await services.accounts.list()

    expect(new Set(list.map((a) => a.id)).size).toBe(list.length)
  })

  it('creates new accounts at the end', async () => {
    const services = createMockServices()

    const created = await services.accounts.create({ name: 'Carteira', kind: 'cash', institution: null })
    const list = await services.accounts.list()

    expect(list[list.length - 1].id).toBe(created.id)
  })
})
