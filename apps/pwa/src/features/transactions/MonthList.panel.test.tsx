import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import { PanelHostContext } from '@/app/layout/panelHost'
import { monthKey, todayIso } from '@/lib/dates'
import { MonthList } from './MonthList'
import { TransactionEditorProvider } from './TransactionEditor'

const month = monthKey(todayIso())

function Address() {
  return <output aria-label="endereço">{useLocation().search}</output>
}

/**
 * The desktop frame hands panels a column to land in. Without one this is the
 * phone, where the filter is a sheet that closes when it is done.
 */
function show(query: string, { desktop }: { desktop: boolean }) {
  const host = document.createElement('div')

  document.body.appendChild(host)

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/?month=${month}&status=pending${query}`]}>
        <PanelHostContext value={desktop ? host : null}>
          <ActiveLedgerProvider>
            <TransactionEditorProvider>
              <MonthList month={month} />
              <Address />
            </TransactionEditorProvider>
          </ActiveLedgerProvider>
        </PanelHostContext>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { host }
}

const address = () => screen.getByLabelText('endereço').textContent ?? ''
const filterPanel = () => screen.queryByRole('dialog', { name: 'Filtrar e ordenar' })

/** The rows of the list, not of anything open beside it. */
function listRows() {
  return screen
    .queryAllByRole('listitem')
    .filter((li) => !li.closest('[role="dialog"]') && li.querySelector('button'))
}

describe('the filter panel on the desktop', () => {
  it('opens from the address, so a reload or a link brings it back', async () => {
    show('&filter_open=1', { desktop: true })

    expect(await screen.findByRole('dialog', { name: 'Filtrar e ordenar' })).toBeTruthy()
  })

  it('writes itself into the address when opened, and out of it when closed', async () => {
    show('', { desktop: true })

    await screen.findAllByRole('listitem')

    expect(address()).not.toContain('filter_open')

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar e ordenar' }))

    await waitFor(() => expect(address()).toContain('filter_open=1'))
    expect(filterPanel()).toBeTruthy()

    fireEvent.click(within(filterPanel()!).getByRole('button', { name: /Fechar/ }))

    await waitFor(() => expect(filterPanel()).toBeNull())
    expect(address()).not.toContain('filter_open')
  })

  it('applies and stays open, so the list can be filtered again', async () => {
    show('&filter_open=1', { desktop: true })

    await screen.findAllByRole('listitem')

    const before = listRows().length

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(listRows().length).toBeLessThan(before))

    expect(filterPanel()).toBeTruthy()
    expect(address()).toContain('filter_open=1')
    expect(address()).toContain('recurring=1')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(listRows().length).toBe(before))
    expect(filterPanel()).toBeTruthy()
  })

  it('is still there after a row is opened and left', async () => {
    show('&filter_open=1', { desktop: true })

    const [first] = await screen.findAllByRole('button', { name: /R\$/ })

    fireEvent.click(first)

    const row = await screen.findByRole('dialog', { name: /^(?!Filtrar)/ })

    expect(row).toBeTruthy()
    expect(address()).toContain('filter_open=1')

    fireEvent.click(within(row).getByRole('button', { name: /Fechar/ }))

    await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(1))

    expect(filterPanel()).toBeTruthy()
    expect(address()).toContain('filter_open=1')
  })

  it('closing it keeps the filters that were applied', async () => {
    show('&filter_open=1&recurring=1', { desktop: true })

    await screen.findByRole('dialog', { name: 'Filtrar e ordenar' })

    fireEvent.click(within(filterPanel()!).getByRole('button', { name: /Fechar/ }))

    await waitFor(() => expect(address()).not.toContain('filter_open'))
    expect(address()).toContain('recurring=1')
  })
})

describe('the filter sheet on the phone', () => {
  it('stays out of the address', async () => {
    show('', { desktop: false })

    await screen.findAllByRole('listitem')

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar e ordenar' }))

    expect(await screen.findByRole('dialog', { name: 'Filtrar e ordenar' })).toBeTruthy()
    expect(address()).not.toContain('filter_open')
  })

  it('does not open from the address', async () => {
    show('&filter_open=1', { desktop: false })

    await screen.findAllByRole('listitem')

    expect(filterPanel()).toBeNull()
  })

  it('applies and closes', async () => {
    show('', { desktop: false })

    await screen.findAllByRole('listitem')

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar e ordenar' }))
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(address()).toContain('recurring=1'))
    await waitFor(() => expect(filterPanel()).toBeNull())
  })
})
