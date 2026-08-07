import { beforeEach, describe, expect, it } from 'vitest'
import { createMockServices } from './index'
import { getActiveLedgerId, setActiveLedgerId } from '@/services/activeLedger'

/**
 * The invite flow through the seam, with no React in the way. When a button
 * appears to do nothing, this is what says whether the nothing happened in the
 * service or on the screen.
 */
describe('mock ledgers', () => {
  const services = createMockServices()

  beforeEach(async () => {
    const [first] = await services.ledgers.list()

    setActiveLedgerId(first.id)
  })

  it('starts on a ledger', async () => {
    const ledgers = await services.ledgers.list()

    expect(ledgers.length).toBeGreaterThan(0)
    expect(getActiveLedgerId()).toBe(ledgers[0].id)
  })

  it('creating an invite makes it show up in the list', async () => {
    const [ledger] = await services.ledgers.list()
    const before = await services.ledgers.invites(ledger.id)

    const created = await services.ledgers.createInvite(ledger.id)
    const after = await services.ledgers.invites(ledger.id)

    expect(created.token).not.toBe('')
    expect(after.length).toBe(before.length + 1)
    expect(after.map((invite) => invite.id)).toContain(created.id)
  })

  it('revoking marks it, so it stops counting as live', async () => {
    const [ledger] = await services.ledgers.list()
    const created = await services.ledgers.createInvite(ledger.id)

    await services.ledgers.revokeInvite(created.id)

    const after = await services.ledgers.invites(ledger.id)

    expect(after.find((invite) => invite.id === created.id)?.revoked_at).not.toBeNull()
  })

  it('accepting moves the app into that ledger', async () => {
    const [ledger] = await services.ledgers.list()
    const created = await services.ledgers.createInvite(ledger.id)

    const joined = await services.ledgers.acceptInvite(created.token)

    expect(joined.id).toBe(ledger.id)
    expect(getActiveLedgerId()).toBe(ledger.id)
  })

  it('refuses a revoked token', async () => {
    const [ledger] = await services.ledgers.list()
    const created = await services.ledgers.createInvite(ledger.id)

    await services.ledgers.revokeInvite(created.id)

    await expect(services.ledgers.acceptInvite(created.token)).rejects.toThrow()
  })
})
