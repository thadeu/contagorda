import { useState } from 'react'
import { useActiveLedger } from '../../../app/ledger/activeLedgerContext'
import { inviteUrl, useCreateInvite, useInvites, useMembers, useRevokeInvite } from '../hooks'
import { Button } from '../../../ui/Button'
import { CheckIcon } from '../../../ui/icons'
import type { LedgerInvite } from '../../../services/types'

/**
 * Choosing a ledger, and letting someone else into it.
 *
 * The switcher only appears once there is a choice to make. A person using this
 * alone should never meet the concept: one ledger, no list, nothing to pick.
 * Sharing is what introduces it, and by then the word means something.
 */
export function LedgerSection() {
  const { ledgers, ledgerId, switchTo } = useActiveLedger()
  const members = useMembers(ledgerId)
  const invites = useInvites(ledgerId)
  const create = useCreateInvite(ledgerId)
  const revoke = useRevokeInvite(ledgerId)

  const [copied, setCopied] = useState<string | null>(null)

  const live = (invites.data ?? []).filter(usable)
  const people = members.data ?? []

  async function copy(token: string) {
    await navigator.clipboard.writeText(inviteUrl(token))
    setCopied(token)
  }

  return (
    <div className="grid gap-2">
      {ledgers.length > 1 && (
        <ul className="grid gap-1">
          {ledgers.map((ledger) => (
            <li key={ledger.id}>
              <button
                type="button"
                onClick={() => switchTo(ledger.id)}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-control px-4 text-left text-[0.9375rem] ${
                  ledger.id === ledgerId ? 'bg-brand text-white' : 'bg-sunken text-ink'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{ledger.name}</span>
                  <span
                    className={`block text-xs ${
                      ledger.id === ledgerId ? 'text-white/60' : 'text-muted'
                    }`}
                  >
                    {ledger.member_count === 1 ? 'só você' : `${ledger.member_count} pessoas`}
                  </span>
                </span>

                {ledger.id === ledgerId && <CheckIcon className="size-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {people.length > 1 && (
        <p className="px-1 text-xs text-muted">
          Neste espaço: {people.map((person) => person.name).join(', ')}
        </p>
      )}

      {live.length === 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Criando convite…' : 'Convidar alguém'}
        </Button>
      ) : (
        live.map((invite) => (
          <div key={invite.id} className="grid gap-2 rounded-control bg-sunken px-4 py-3">
            <p className="text-xs text-muted">
              Convite válido até {new Date(invite.expires_at).toLocaleDateString('pt-BR')}. Quem
              abrir o link e entrar passa a ver este espaço.
            </p>

            <p className="truncate text-xs text-faint">{inviteUrl(invite.token)}</p>

            <div className="flex gap-2">
              <Button type="button" className="flex-1" onClick={() => copy(invite.token)}>
                {copied === invite.token ? 'Copiado' : 'Copiar link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(invite.id)}
              >
                Revogar
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function usable(invite: LedgerInvite): boolean {
  return (
    invite.revoked_at === null &&
    invite.accepted_at === null &&
    invite.expires_at > new Date().toISOString()
  )
}
