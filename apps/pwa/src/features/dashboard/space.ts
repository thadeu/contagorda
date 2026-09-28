import type { Ledger } from '@/services/types'

/**
 * What to call the active space.
 *
 * A space somebody let you into is named for whose it is, not for the name they
 * gave it: that name was chosen for their own list, where it was the only one,
 * and here it sits under the face of whoever is holding the phone. Yours keeps
 * its own name, which is the point of having one.
 */
export function spaceName(ledger: Ledger | null): string {
  if (!ledger) return ''

  return ledger.role === 'member' ? (ledger.owner_name ?? ledger.name) : ledger.name
}

/**
 * Shared means more than one person can see it, whoever owns it. That is the
 * distinction that matters to somebody about to type an amount — not who holds
 * the title to the space, but whether what they enter will be read by anyone
 * else.
 */
export function spaceKind(ledger: Ledger | null): string {
  if (!ledger) return ''

  return ledger.member_count > 1 ? 'compartilhado' : 'pessoal'
}
