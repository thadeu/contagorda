import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiServices } from '@/services/api'
import { provideToken } from '@/services/http'
import { setActiveLedgerId } from '@/services/activeLedger'

/**
 * What goes on the wire.
 *
 * The endpoints are covered on the Rails side, where they run against a real
 * database. What is not covered there is this half of the contract: whether the
 * client asks the right URL with the right verb and the right headers. A typo
 * in a path is invisible to both suites otherwise, and shows up as a 404 on a
 * phone.
 */
describe('the API client', () => {
  const services = createApiServices()
  let calls: { url: string; init: RequestInit }[] = []

  function reply(body: unknown = {}, status = 200) {
    return Promise.resolve(
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }

  beforeEach(() => {
    calls = []
    setActiveLedgerId('019fce00-0000-7000-8000-00000000000a')
    provideToken(async () => 'token-abc')

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: RequestInit) => {
        calls.push({ url, init })

        return reply([])
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setActiveLedgerId(null)
  })

  function headers() {
    return calls[0].init.headers as Record<string, string>
  }

  it('carries the token and the ledger on every call', async () => {
    await services.transactions.listByMonth('2026-08')

    expect(calls[0].url).toBe('http://127.0.0.1:3000/api/v1/transactions?month=2026-08')
    expect(headers().Authorization).toBe('Bearer token-abc')
    expect(headers()['X-Ledger-Id']).toBe('019fce00-0000-7000-8000-00000000000a')
  })

  // Read at call time, not captured at import: switching ledgers has to change
  // where the next request lands.
  it('follows a ledger switch', async () => {
    setActiveLedgerId('019fce00-0000-7000-8000-00000000000b')

    await services.accounts.list()

    expect(headers()['X-Ledger-Id']).toBe('019fce00-0000-7000-8000-00000000000b')
  })

  it('hands the signal to fetch', async () => {
    const controller = new AbortController()

    await services.transactions.months({ signal: controller.signal })

    expect(calls[0].init.signal).toBe(controller.signal)
  })

  // A phone on a bad connection retries on its own. The key is what makes that
  // harmless.
  it('sends an idempotency key on the writes that create', async () => {
    await services.transactions.create({
      account_id: 'a1',
      category_id: null,
      kind: 'expense',
      amount_cents: 1000,
      date: '2026-08-10',
      description: 'Mercado',
      paid: false,
    })

    expect(calls[0].init.method).toBe('POST')
    expect(headers()['Idempotency-Key']).toBeTruthy()
  })

  it('does not send one on an edit', async () => {
    await services.transactions.setPaid('t1', true)

    expect(calls[0].init.method).toBe('PUT')
    expect(headers()['Idempotency-Key']).toBeUndefined()
  })

  it.each([
    ['months', () => services.transactions.months(), 'GET', '/months'],
    ['summary', () => services.transactions.summary('2026-08'), 'GET', '/months/2026-08/summary'],
    ['totals', () => services.transactions.monthlyTotals(null), 'GET', '/monthly_totals'],
    ['totals by category', () => services.transactions.monthlyTotals('c1'), 'GET', '/monthly_totals?category_id=c1'],
    ['delete one', () => services.transactions.remove('t1'), 'DELETE', '/transactions/t1?scope=one'],
    ['delete future', () => services.transactions.remove('t1', 'future'), 'DELETE', '/transactions/t1?scope=future'],
    ['repeat', () => services.transactions.repeat('t1', { frequency: 'monthly', interval: 1, repeats: 3 }), 'POST', '/transactions/t1/recurrence'],
    ['accounts', () => services.accounts.list(), 'GET', '/accounts'],
    ['archive', () => services.accounts.archive('a1'), 'POST', '/accounts/a1/archive'],
    ['opening balances', () => services.accounts.openingBalances('2026-08'), 'GET', '/accounts/opening_balances?month=2026-08'],
    ['set opening balance', () => services.accounts.setOpeningBalance('a1', '2026-08', 100), 'PUT', '/accounts/a1/opening_balances/2026-08'],
    ['categories', () => services.categories.list(), 'GET', '/categories'],
    ['ledgers', () => services.ledgers.list(), 'GET', '/ledgers'],
    ['members', () => services.ledgers.members('l1'), 'GET', '/ledgers/l1/members'],
    ['invites', () => services.ledgers.invites('l1'), 'GET', '/ledgers/l1/invites'],
    ['accept', () => services.ledgers.acceptInvite('tok en'), 'POST', '/invites/tok%20en/accept'],
    ['profile', () => services.profile.get(), 'GET', '/me'],
  ])('asks the right thing for %s', async (_name, call, method, path) => {
    await call()

    expect(calls[0].init.method ?? 'GET').toBe(method)
    expect(calls[0].url).toBe(`http://127.0.0.1:3000/api/v1${path}`)
  })

  it('leaves an omitted query parameter out entirely', async () => {
    await services.transactions.monthlyTotals(undefined)

    expect(calls[0].url).not.toContain('?')
  })

  // The server writes its message in Portuguese; the app shows what arrived. A
  // client that turned codes into sentences would need a release to fix a word.
  it('raises the message the server wrote', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        reply({ error: { code: 'invite_dead', message: 'Esse convite não vale mais.' } }, 410),
      ),
    )

    await expect(services.ledgers.acceptInvite('dead')).rejects.toThrow('Esse convite não vale mais.')
  })

  it('answers undefined to a 204', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reply(null, 204)))

    await expect(services.categories.remove('c1')).resolves.toBeUndefined()
  })
})
