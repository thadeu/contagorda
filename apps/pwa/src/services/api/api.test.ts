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

  // The source month is in the path and the target travels in the body: the
  // server reads it as "this month, copied to that one", and a swap would copy
  // the wrong way round without any error to show for it.
  it('asks to copy a month with the target in the body, and a key', async () => {
    await services.monthClones.start('2026-09', '2026-10')

    expect(calls[0].url).toBe('http://127.0.0.1:3000/api/v1/months/2026-09/clone')
    expect(calls[0].init.method).toBe('POST')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ target: '2026-10' })
    expect(headers()['Idempotency-Key']).toBeTruthy()
  })

  it('reads how far a copy has got', async () => {
    await services.monthClones.get('abc')

    expect(calls[0].url).toBe('http://127.0.0.1:3000/api/v1/month_clones/abc')
    expect(calls[0].init.method).toBe('GET')
  })

  it('changes how a series repeats with a PUT to the row', async () => {
    await services.transactions.reschedule('abc', { frequency: 'monthly', interval: 2, repeats: 5 })

    expect(calls[0].url).toBe('http://127.0.0.1:3000/api/v1/transactions/abc/recurrence')
    expect(calls[0].init.method).toBe('PUT')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      frequency: 'monthly',
      interval: 2,
      repeats: 5,
    })
  })

  // The API ignores a field it does not know and answers 200, so a save that
  // handed a row to someone else can come back looking fine and be wrong.
  it('says so when the server left the author where it was', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => reply({ id: 't', created_by_id: 'ana' })),
    )

    await expect(
      services.transactions.update('t', { created_by_id: 'jess' }),
    ).rejects.toMatchObject({ code: 'author_not_applied' })
  })

  it('accepts the answer when the author is the one asked for', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => reply({ id: 't', created_by_id: 'jess' })),
    )

    await expect(services.transactions.update('t', { created_by_id: 'jess' })).resolves.toMatchObject({
      created_by_id: 'jess',
    })
  })

  it('does not look at the author when none was sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => reply({ id: 't', created_by_id: 'ana' })),
    )

    await expect(services.transactions.update('t', { amount_cents: 5 })).resolves.toBeDefined()
  })

  it('asks the search route with the term', async () => {
    await services.transactions.search('farmácia')

    expect(calls[0].url).toBe('http://127.0.0.1:3000/api/v1/search?q=farm%C3%A1cia')
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
    ['reorder', () => services.accounts.reorder(['a2', 'a1']), 'PUT', '/accounts/order'],
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

  // The whole order in one body. One request per moved account would let a
  // dropped connection land half an arrangement nobody made.
  it('sends the account ids in the order they were left in', async () => {
    await services.accounts.reorder(['a3', 'a1', 'a2'])

    expect(JSON.parse(calls[0].init.body as string)).toEqual({ ids: ['a3', 'a1', 'a2'] })
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
