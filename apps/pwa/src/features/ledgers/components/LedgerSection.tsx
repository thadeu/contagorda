import { useState } from 'react'
import { useActiveLedger } from '../../../app/ledger/activeLedgerContext'
import { canInvite } from '../canInvite'
import { inviteUrl, useCreateInvite, useInvites, useMembers, useRevokeInvite } from '../hooks'
import { Button } from '../../../ui/Button'
import { shareOrCopy, type ShareResult } from '../../../ui/share'
import { CheckIcon } from '../../../ui/icons'
import type { LedgerInvite } from '../../../services/types'

/**
 * Choosing a ledger, and letting someone else into it.
 *
 * The switcher only appears once there is a choice to make. A person using this
 * alone should never meet the concept: one ledger, no list, nothing to pick.
 * Sharing is what introduces it, and by then the word means something.
 *
 * Inviting is the owner's alone, so a member is not shown the control. That is
 * politeness rather than protection — the rule that matters lives where the
 * invite is minted, and the day this is a real API a member who wants to invite
 * someone will not be asking this screen for permission.
 */
export function LedgerSection() {
  const { ledgers, ledgerId, current, switchTo } = useActiveLedger()
  const members = useMembers(ledgerId)
  const invites = useInvites(ledgerId)
  const create = useCreateInvite(ledgerId)
  const revoke = useRevokeInvite(ledgerId)

  const [sent, setSent] = useState<ShareResult | null>(null)

  const live = (invites.data ?? []).filter(usable)
  const people = members.data ?? []

  async function share(token: string) {
    setSent(await shareOrCopy(inviteUrl(token), 'Entrar no meu espaço no Conta Gorda'))
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

      {create.isError && (
        <p role="alert" className="px-1 text-xs text-out">
          Não deu para criar o convite. Tente de novo.
        </p>
      )}

      {canInvite(current) && live.length === 0 && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Criando convite…' : 'Convidar alguém'}
        </Button>
      )}

      {canInvite(current) &&
        live.map((invite) => (
          <div key={invite.id} className="grid gap-2 rounded-control bg-sunken px-4 py-3">
            <p className="text-xs text-muted">
              Convite válido até {new Date(invite.expires_at).toLocaleDateString('pt-BR')}. Quem
              abrir o link e entrar passa a ver este espaço.
            </p>

            <p className="truncate text-xs text-faint">{inviteUrl(invite.token)}</p>

            <div className="flex gap-2">
              <Button type="button" className="flex-1" onClick={() => share(invite.token)}>
                {label(sent)}
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
        ))}
    </div>
  )
}

/**
 * The button says what happened, because the two outcomes look nothing alike.
 * A native sheet is its own confirmation; a silent clipboard write is not.
 */
function label(sent: ShareResult | null): string {
  if (sent === 'copied') return 'Link copiado'

  if (sent === 'failed') return 'Não deu para compartilhar'

  return 'Compartilhar convite'
}

function usable(invite: LedgerInvite): boolean {
  return (
    invite.revoked_at === null &&
    invite.accepted_at === null &&
    invite.expires_at > new Date().toISOString()
  )
}
