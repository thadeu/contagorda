import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router'
import { describe, expect, it } from 'vitest'
import { monthKey, monthLabel, shiftMonth, todayIso } from '@/lib/dates'
import { MonthCloneProvider } from './MonthCloneProvider'
import { useMonthCloner } from './monthCloneContext'

const source = shiftMonth(monthKey(todayIso()), -1)

function Opener() {
  const cloner = useMonthCloner()
  const [params] = useSearchParams()

  return (
    <>
      <button type="button" onClick={() => cloner.openFrom(source)}>
        abrir
      </button>

      <output aria-label="mês na tela">{params.get('month')}</output>
    </>
  )
}

function renderProvider() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MonthCloneProvider>
          <Opener />
        </MonthCloneProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MonthCloneProvider', () => {
  /**
   * The whole path, against the mock: ask, choose, watch it run, see it end. The
   * mock fills in batches over time, which is the shape the real job has, so
   * this fails if the screen only handles a copy that is instant.
   */
  it('copies a month and reports it, from the sheet to the end', async () => {
    renderProvider()

    fireEvent.click(screen.getByRole('button', { name: 'abrir' }))
    fireEvent.click(await screen.findByRole('button', { name: /^copiar para/i }))

    const target = shiftMonth(source, 1)

    expect((await screen.findByText(/^Copiando para/)).textContent).toContain(monthLabel(target))
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByLabelText('mês na tela').textContent).toBe(target)

    await waitFor(() => expect(screen.getByText(/lançamentos? copiados?/)).toBeTruthy(), {
      timeout: 8000,
    })

    expect(screen.queryByText(/^Copiando para/)).toBeNull()
  }, 12_000)

  it('can be closed without copying anything', async () => {
    renderProvider()

    fireEvent.click(screen.getByRole('button', { name: 'abrir' }))
    await screen.findByRole('radiogroup')

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))

    await waitFor(() => expect(screen.queryByRole('radiogroup')).toBeNull())

    expect(screen.queryByText(/^Copiando para/)).toBeNull()
  })
})
