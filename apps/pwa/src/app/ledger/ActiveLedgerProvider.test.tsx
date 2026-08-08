import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActiveLedgerProvider } from './ActiveLedgerProvider'
import { services } from '@/services'

function renderProvider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <ActiveLedgerProvider>
        <p>a dashboard</p>
      </ActiveLedgerProvider>
    </QueryClientProvider>,
  )
}

describe('ActiveLedgerProvider', () => {
  it('renders the app once a ledger is known', async () => {
    renderProvider()

    expect(await screen.findByText('a dashboard')).toBeTruthy()
  })

  // The whole app blocks on this answer, so a failure has nowhere to fall back
  // to — but that is not a reason to show nothing. A blank screen says the app
  // is broken and offers no move.
  it('says so when the ledgers cannot be loaded', async () => {
    vi.spyOn(services.ledgers, 'list').mockRejectedValueOnce(new Error('offline'))

    renderProvider()

    await waitFor(() => {
      expect(screen.getByText(/sem conexão com o servidor/i)).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeTruthy()
    expect(screen.queryByText('a dashboard')).toBeNull()
  })

  // `GET /ledgers` is never empty by contract — signing up creates one — so an
  // empty answer means something upstream is wrong. Waiting forever for a
  // ledger that is not coming is the one thing not to do.
  it('treats an empty list as a failure rather than waiting', async () => {
    vi.spyOn(services.ledgers, 'list').mockResolvedValueOnce([])

    renderProvider()

    await waitFor(() => {
      expect(screen.getByText(/sem conexão com o servidor/i)).toBeTruthy()
    })
  })
})
