import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ClowkProvider } from '@clowk/react'
import { configure, resetConfig, createMemoryStorage, REFRESH_TOKEN_KEY } from '@clowk/core'
import type { TokenStorage } from '@clowk/core'
import App from './App'

function jwt(claims: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

  return `${encode({ alg: 'RS256', kid: 'k1' })}.${encode(claims)}.sig`
}

function accessToken(): string {
  return jwt({
    sub: 'user_123',
    email: 'thadeu@example.com',
    exp: Math.floor(Date.now() / 1000) + 900,
  })
}

/**
 * Stubs fetch so both hops are visible: the refresh that restores the session
 * and the call to our own API. Routing on the URL rather than call order keeps
 * the test honest about which request produced which response.
 */
function stubFetch(me: Record<string, unknown> | { status: number }) {
  const calls: string[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      const href = url.toString()

      calls.push(href)

      if (href.includes('/sessions/refresh')) {
        return Response.json({ access_token: accessToken(), refresh_token: 'clk_rt_2' })
      }

      if ('status' in me && typeof me.status === 'number') {
        return new Response('{}', { status: me.status })
      }

      return Response.json(me)
    }),
  )

  return calls
}

function renderApp(storage: TokenStorage) {
  return render(
    <ClowkProvider publishableKey="pk_test_1" storage={storage}>
      <App />
    </ClowkProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    resetConfig()
    configure({ publishableKey: 'pk_test_1', subdomainUrl: 'https://acme.clowk.dev' })
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('offers sign in when signed out', async () => {
    stubFetch({})

    renderApp(createMemoryStorage())

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeDefined()
  })

  // The reload path: the access token only lives in memory, so a stored refresh
  // token is the only thing that can bring the session back.
  it('restores the session and shows what the API returned', async () => {
    const storage = createMemoryStorage()

    storage.set(REFRESH_TOKEN_KEY, 'clk_rt_1')

    const calls = stubFetch({
      id: '019fcecb-ad92-7838-941d-2271ed9fa397',
      email: 'thadeu@example.com',
      name: 'Thadeu',
      avatar_url: null,
    })

    renderApp(storage)

    expect(await screen.findByText('019fcecb-ad92-7838-941d-2271ed9fa397')).toBeDefined()
    expect(calls.some((c) => c.includes('/sessions/refresh'))).toBe(true)
    expect(calls.some((c) => c.includes('/api/v1/me'))).toBe(true)
  })

  it('sends the access token as a bearer credential', async () => {
    const storage = createMemoryStorage()

    storage.set(REFRESH_TOKEN_KEY, 'clk_rt_1')
    stubFetch({ id: 'x', email: 'a@b.com', name: null, avatar_url: null })

    renderApp(storage)

    await screen.findByText('a@b.com')

    const meCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => url.toString().includes('/api/v1/me'))
    const headers = (meCall?.[1]?.headers ?? {}) as Record<string, string>

    expect(headers.Authorization).toMatch(/^Bearer ey/)
  })

  it('surfaces an API failure instead of hanging on the spinner', async () => {
    const storage = createMemoryStorage()

    storage.set(REFRESH_TOKEN_KEY, 'clk_rt_1')
    stubFetch({ status: 401 })

    renderApp(storage)

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined())
  })
})
