import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LedgerSection } from './LedgerSection'
import { ActiveLedgerProvider } from '../../../app/ledger/ActiveLedgerProvider'
import { ActiveLedgerContext } from '../../../app/ledger/activeLedgerContext'

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <ActiveLedgerProvider>
        <LedgerSection />
      </ActiveLedgerProvider>
    </QueryClientProvider>,
  )
}

describe('LedgerSection', () => {
  it('turns the invite button into a live invite', async () => {
    renderSection()

    const button = await screen.findByRole('button', { name: /convidar/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/convite pendente/i)).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: /^compartilhar$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /revogar/i })).toBeTruthy()
  })
})

describe('LedgerSection for a member', () => {
  it('does not offer to invite anyone', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <ActiveLedgerContext
          value={{
            ledgerId: 'l1',
            ledgers: [
              { id: 'l1', name: 'Nossa casa', member_count: 2, role: 'member' },
              { id: 'l2', name: 'Meu espaço', member_count: 1, role: 'owner' },
            ],
            current: { id: 'l1', name: 'Nossa casa', member_count: 2, role: 'member' },
            shared: true,
            switchTo: () => {},
          }}
        >
          <LedgerSection />
        </ActiveLedgerContext>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/nossa casa/i)).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: /convidar/i })).toBeNull()
  })
})
