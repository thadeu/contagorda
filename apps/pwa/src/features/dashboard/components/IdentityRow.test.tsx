import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IdentityRow } from './IdentityRow'
import { ActiveLedgerContext } from '@/app/ledger/activeLedgerContext'
import type { Ledger } from '@/services/types'

/**
 * The row answers "where does what I type next end up".
 *
 * It named the person before, which was the wrong answer on a shared space:
 * reading your own name at the top of your own phone says "this is mine" while
 * every entry is landing somewhere two people can see.
 */
function renderRow(current: Ledger) {
  render(
    <ActiveLedgerContext
      value={{
        ledgerId: current.id,
        ledgers: [current],
        current,
        shared: current.member_count > 1,
        switchTo: () => {},
      }}
    >
      <IdentityRow
        name="Ana"
        avatarUrl={null}
        onOpenProfile={vi.fn()}
        onOpenAccounts={vi.fn()}
      />
    </ActiveLedgerContext>,
  )
}

describe('IdentityRow', () => {
  it('names a space of your own by its name', () => {
    renderRow({
      id: 'l1',
      name: 'Conta Pessoal',
      member_count: 1,
      role: 'owner',
      owner_name: 'Ana',
      owner_email: 'ana@exemplo.com',
    })

    expect(screen.getByText('Conta Pessoal')).toBeTruthy()
    expect(screen.getByText('pessoal')).toBeTruthy()
  })

  // Reading it on Ana's phone: the space is Thadeu's, and saying "Ana" here is
  // what made it look like her own books.
  it('names a space you were let into by whose it is', () => {
    renderRow({
      id: 'l2',
      name: 'Conta Pessoal',
      member_count: 2,
      role: 'member',
      owner_name: 'Thadeu',
      owner_email: 'thadeu@exemplo.com',
    })

    expect(screen.getByText('Thadeu')).toBeTruthy()
    expect(screen.getByText('compartilhado')).toBeTruthy()
    expect(screen.queryByText('Ana')).toBeNull()
  })

  // Shared is about who can read it, not about who holds it: an owner who
  // invited somebody is in a shared space too.
  it('calls a space you own with somebody else shared', () => {
    renderRow({
      id: 'l3',
      name: 'Nossa casa',
      member_count: 2,
      role: 'owner',
      owner_name: 'Ana',
      owner_email: 'ana@exemplo.com',
    })

    expect(screen.getByText('Nossa casa')).toBeTruthy()
    expect(screen.getByText('compartilhado')).toBeTruthy()
  })
})
