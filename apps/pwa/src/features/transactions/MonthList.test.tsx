import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import { monthKey, todayIso } from '@/lib/dates'
import { MonthList } from './MonthList'
import { TransactionEditorProvider } from './TransactionEditor'

const month = monthKey(todayIso())

function show(query: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/?month=${month}&status=pending${query}`]}>
        <ActiveLedgerProvider>
          <TransactionEditorProvider>
            <MonthList month={month} />
          </TransactionEditorProvider>
        </ActiveLedgerProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Rows on screen, and how many of them carry the tag of a series. */
function rows() {
  const items = screen.queryAllByRole('listitem')

  return { all: items.length, recurring: items.filter((li) => within(li).queryByLabelText(/ de \d+$/)).length }
}

describe('MonthList filters', () => {
  it('shows recurring and one-off rows together by default', async () => {
    show('')

    await screen.findAllByRole('listitem')

    const { all, recurring } = rows()

    expect(recurring).toBeGreaterThan(0)
    expect(all).toBeGreaterThan(recurring)
  })

  it('shows only rows that repeat when asked through the address', async () => {
    show('&recurring=1')

    await screen.findAllByRole('listitem')

    const { all, recurring } = rows()

    expect(all).toBeGreaterThan(0)
    expect(recurring).toBe(all)
    expect(screen.getByRole('button', { name: 'Tirar o filtro Recorrentes' })).toBeTruthy()
  })

  it('narrows the list from the sheet, and widens it again from the chip', async () => {
    show('')

    await screen.findAllByRole('listitem')

    const before = rows().all

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar e ordenar' }))
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    await waitFor(() => expect(rows().all).toBeLessThan(before))

    fireEvent.click(await screen.findByRole('button', { name: 'Tirar o filtro Recorrentes' }))

    await waitFor(() => expect(rows().all).toBe(before))
  })

  it('says so when the filters leave nothing', async () => {
    show('&by=ninguem')

    expect(await screen.findByText('Nenhum lançamento com esses filtros')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() => expect(screen.queryByText('Nenhum lançamento com esses filtros')).toBeNull())
  })
})
