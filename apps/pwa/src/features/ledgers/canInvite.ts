import type { Ledger } from '@/services/types'

/**
 * Only an owner may let someone else in.
 *
 * This hides a button; it does not protect anything. The rule has to be enforced
 * where the invite is minted, because a member who wants to invite someone does
 * not need this screen to try — hiding a control is a courtesy to people using
 * the app normally, never a defence against anyone who is not.
 */
export function canInvite(ledger: Ledger | null): boolean {
  return ledger?.role === 'owner'
}
