import { useActiveLedger } from '../../app/ledger/activeLedgerContext'
import { useMembers } from './hooks'

/**
 * Who a stored id refers to, in a name a person recognises.
 *
 * Returns null when there is nobody to name — an older row entered before the
 * app recorded it, or a member who has since been removed. Every caller has to
 * decide what to show then, and the honest answer is usually nothing: inventing
 * "Desconhecido" states something the app does not know.
 */
export function useMemberName(memberId: string | null): string | null {
  const { ledgerId } = useActiveLedger()
  const members = useMembers(ledgerId)

  if (!memberId) return null

  return members.data?.find((member) => member.id === memberId)?.name ?? null
}
