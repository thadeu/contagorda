import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { monthKey, todayIso } from '@/lib/dates'
import { MonthList } from '@/features/transactions/MonthList'
import { AppShell } from './AppShell'

vi.mock('@clowk/react', () => ({
  useAuth: () => ({ user: { name: 'Thadeu Esteves', email: 'tadeuu@gmail.com' }, signOut: vi.fn() }),
}))

const month = monthKey(todayIso())

function useDesktop(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function open(search: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppShell />, children: [{ index: true, element: <MonthList month={month} /> }] }],
    { initialEntries: [`/?month=${month}&status=pending${search}`] },
  )

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return router
}

/** The panel on top is the last one the column received. */
function topPanel(): string | null {
  const dialogs = screen.queryAllByRole('dialog')

  return dialogs.length === 0 ? null : dialogs[dialogs.length - 1].getAttribute('aria-label')
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('the desktop frame on arrival', () => {
  it('opens the account panel on its own, as before', async () => {
    useDesktop(true)
    open('')

    await waitFor(() => expect(topPanel()).toBe('Conta'))
  })

  /**
   * A reload with the filter open has two panels to put in the column at once:
   * the account panel that opens with the app, and the filter the address asks
   * for. The filter is what was being used, so it has to be the one on top.
   */
  it('puts the filter on top of the account panel when the address asks for it', async () => {
    useDesktop(true)
    open('&filter_open=1')

    await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(2))

    expect(topPanel()).toBe('Filtrar e ordenar')
  })

  it('gives the account panel back when the filter is closed', async () => {
    useDesktop(true)

    const router = open('&filter_open=1')

    await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(2))

    const filter = screen.getByRole('dialog', { name: 'Filtrar e ordenar' })

    fireEvent.click(within(filter).getByRole('button', { name: /Fechar/ }))

    await waitFor(() => expect(topPanel()).toBe('Conta'))
    expect(router.state.location.search).not.toContain('filter_open')
  })
})
