import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileButton } from './ProfileButton'
import { ActiveLedgerProvider } from '../../../app/ledger/ActiveLedgerProvider'

vi.mock('@clowk/react', () => ({
  useAuth: () => ({
    user: { name: 'Thadeu Esteves', email: 'thadeu@exemplo.com', avatar_url: null },
    signOut: vi.fn(),
  }),
}))

/**
 * The invite button as it actually ships: inside the profile sheet, inside the
 * bottom sheet, inside the providers. The section on its own already passed, so
 * anything failing here is something the composition does and the piece does
 * not.
 */
describe('ProfileButton', () => {
  it('creates an invite from inside the sheet', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={client}>
        <ActiveLedgerProvider>
          <ProfileButton name="Thadeu" email="thadeu@exemplo.com" avatarUrl={null} />
        </ActiveLedgerProvider>
      </QueryClientProvider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /sua conta/i }))

    const invite = await screen.findByRole('button', { name: /convidar/i })

    fireEvent.click(invite)

    await waitFor(() => {
      expect(screen.getByText(/convite pendente/i)).toBeTruthy()
    })
  })
})
