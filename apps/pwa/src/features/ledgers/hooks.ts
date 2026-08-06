import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../../services'
import { ledgerKeys } from '../../app/ledger/activeLedgerContext'

export function useMembers(ledgerId: string | null) {
  return useQuery({
    queryKey: ledgerKeys.members(ledgerId ?? ''),
    queryFn: () => services.ledgers.members(ledgerId!),
    enabled: ledgerId !== null,
  })
}

export function useInvites(ledgerId: string | null) {
  return useQuery({
    queryKey: ledgerKeys.invites(ledgerId ?? ''),
    queryFn: () => services.ledgers.invites(ledgerId!),
    enabled: ledgerId !== null,
  })
}

export function useCreateInvite(ledgerId: string | null) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: () => services.ledgers.createInvite(ledgerId!),
    onSuccess: () => client.invalidateQueries({ queryKey: ledgerKeys.invites(ledgerId ?? '') }),
  })
}

export function useRevokeInvite(ledgerId: string | null) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.ledgers.revokeInvite(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ledgerKeys.invites(ledgerId ?? '') }),
  })
}

export function useRemoveMember(ledgerId: string | null) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => services.ledgers.removeMember(ledgerId!, memberId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ledgerKeys.members(ledgerId ?? '') })
      void client.invalidateQueries({ queryKey: ledgerKeys.list })
    },
  })
}

export function useAcceptInvite() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => services.ledgers.acceptInvite(token),
    /**
     * Everything is reloaded, not just the ledger list. Accepting moves the app
     * into a ledger whose accounts, months and categories are all different —
     * keeping any of the previous ones cached would show the new ledger with the
     * old one's data until each query happened to refetch.
     */
    onSuccess: () => client.clear(),
  })
}

/** A live invite: not spent, not revoked, not past its date. */
export function inviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`
}
