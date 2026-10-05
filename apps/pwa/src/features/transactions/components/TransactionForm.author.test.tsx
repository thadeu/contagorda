import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActiveLedgerContext, ledgerKeys } from '@/app/ledger/activeLedgerContext'
import type { Ledger, LedgerMember } from '@/services/types'
import { TransactionForm } from './TransactionForm'

const members: LedgerMember[] = [
  { id: 'ana', name: 'Ana', email: 'ana@exemplo.com', role: 'owner', you: true },
  { id: 'jess', name: 'Jéssica', email: 'jecoiega7@gmail.com', role: 'member', you: false },
]

function ledger(role: Ledger['role']): Ledger {
  return {
    id: 'l1',
    name: 'Casa',
    member_count: 2,
    role,
    owner_name: 'Ana',
    owner_email: 'ana@exemplo.com',
  }
}

function show({
  role = 'owner',
  authorId,
  people = members,
}: {
  role?: Ledger['role']
  authorId?: string | null
  people?: LedgerMember[]
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })

  client.setQueryData(ledgerKeys.members('l1'), people)

  const onSubmit = vi.fn()
  const current = ledger(role)

  const { container } = render(
    <QueryClientProvider client={client}>
      <ActiveLedgerContext
        value={{ ledgerId: 'l1', ledgers: [current], shared: true, current, switchTo: vi.fn() }}
      >
        <TransactionForm
          id="f"
          authorId={authorId}
          initial={{ amount: '10,00', description: 'Mercado', accountId: 'a1' }}
          onSubmit={onSubmit}
        />
      </ActiveLedgerContext>
    </QueryClientProvider>,
  )

  return { onSubmit, form: container.querySelector('form')! }
}

describe('TransactionForm, whose row it is', () => {
  it('lets the owner hand a row to someone else', async () => {
    const { onSubmit, form } = show({ authorId: 'ana' })

    fireEvent.click(await screen.findByRole('button', { name: /Lançado por/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Jéssica/ }))
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ created_by_id: 'jess' }))
  })

  it('lets the owner take over a row somebody else entered', async () => {
    const { onSubmit, form } = show({ authorId: 'jess' })

    fireEvent.click(await screen.findByRole('button', { name: /Lançado por/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Ana \(você\)/ }))
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ created_by_id: 'ana' }))
  })

  it('sends no author when it was not changed', async () => {
    const { onSubmit, form } = show({ authorId: 'ana' })

    await screen.findByRole('button', { name: /Lançado por/ })
    fireEvent.submit(form)

    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('created_by_id')
  })

  it('gives a guest the name and no way to change it', async () => {
    show({ role: 'member', authorId: 'jess' })

    expect(await screen.findByText('Jéssica')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Lançado por/ })).toBeNull()
  })

  it('shows no author on a new row, where it is whoever is signed in', async () => {
    show({ authorId: undefined })

    await waitFor(() => expect(screen.getByText('Já paguei')).toBeTruthy())

    expect(screen.queryByText('Lançado por')).toBeNull()
  })

  it('has nobody to hand a row to when the owner is alone', async () => {
    show({ authorId: 'ana', people: [members[0]] })

    await waitFor(() => expect(screen.getByText('Já paguei')).toBeTruthy())

    expect(screen.queryByRole('button', { name: /Lançado por/ })).toBeNull()
  })
})
