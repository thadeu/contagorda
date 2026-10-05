import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { monthKey, todayIso } from '@/lib/dates'
import { services } from '@/services'
import type { Scope } from '@/services/ports'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import { TransactionEditorProvider } from './TransactionEditor'
import { useTransactionEditor } from './transactionEditorContext'

function Opener({ id, scope }: { id: string; scope: Scope }) {
  const editor = useTransactionEditor()

  return (
    <button type="button" onClick={() => editor.openEdit(id, scope)}>
      editar
    </button>
  )
}

async function openEditor(scope: Scope, pick: 'series' | 'alone') {
  const rows = await services.transactions.listByMonth(monthKey(todayIso()))
  const row = rows.find((t) => (pick === 'series') === (t.recurring_series_id !== null))

  expect(row).toBeDefined()

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ActiveLedgerProvider>
          <TransactionEditorProvider>
            <Opener id={row!.id} scope={scope} />
          </TransactionEditorProvider>
        </ActiveLedgerProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  fireEvent.click(await screen.findByRole('button', { name: 'editar' }))

  await screen.findByText(/Editar (Despesa|Receita)/, {}, { timeout: 3000 })
}

describe('editing a row of a series', () => {
  /**
   * The rule belongs to all the rows, so it can be changed when the edit reaches
   * the ones after this one, and not when it is about this one alone.
   */
  it('offers the repeat when the edit reaches the next ones', async () => {
    await openEditor('future', 'series')

    expect(screen.getByRole('button', { name: /repetir/i }).textContent).toMatch(/×/)
  })

  it('leaves the repeat out when the edit is about this one only', async () => {
    await openEditor('one', 'series')

    await waitFor(() => expect(screen.queryByRole('button', { name: /repetir/i })).toBeNull())
  })

  it('still offers to start a series on a row that has none', async () => {
    await openEditor('one', 'alone')

    expect(screen.getByRole('button', { name: /repetir/i }).textContent).toMatch(/não se repete/i)
  })
})

describe('when a save is refused', () => {
  it('says why, in what the server said', async () => {
    const refuse = vi
      .spyOn(services.transactions, 'update')
      .mockRejectedValue(new Error('Só quem é dono pode fazer isso.'))

    await openEditor('one', 'alone')

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    expect((await screen.findByRole('alert')).textContent).toBe('Só quem é dono pode fazer isso.')

    refuse.mockRestore()
  })
})
