import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LedgerSection } from './LedgerSection'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import { ActiveLedgerContext } from '@/app/ledger/activeLedgerContext'

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
              {
                id: 'l1',
                name: 'Nossa casa',
                member_count: 2,
                role: 'member',
                owner_name: 'Ana',
                owner_email: 'ana@exemplo.com',
              },
              {
                id: 'l2',
                name: 'Conta Pessoal',
                member_count: 1,
                role: 'owner',
                owner_name: 'Você',
                owner_email: 'voce@exemplo.com',
              },
            ],
            current: {
              id: 'l1',
              name: 'Nossa casa',
              member_count: 2,
              role: 'member',
              owner_name: 'Ana',
              owner_email: 'ana@exemplo.com',
            },
            shared: true,
            switchTo: () => {},
          }}
        >
          <LedgerSection />
        </ActiveLedgerContext>
      </QueryClientProvider>,
    )

    // A space somebody let you into is known by whose it is, not by the name
    // they chose for it back when it was the only one in their own list.
    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeTruthy()
    })

    expect(screen.getByText('ana@exemplo.com')).toBeTruthy()
    expect(screen.getByText(/compartilhado comigo/i)).toBeTruthy()
    expect(screen.queryByText(/nossa casa/i)).toBeNull()

    // The roster would be the owner and you, which the row above already said.
    expect(screen.queryByText(/quem tem acesso/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /convidar/i })).toBeNull()
  })
})
