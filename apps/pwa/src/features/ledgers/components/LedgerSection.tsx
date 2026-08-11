import { useState } from 'react'
import { useActiveLedger } from '@/app/ledger/activeLedgerContext'
import { canInvite } from '@/features/ledgers/canInvite'
import {
  inviteUrl,
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useRevokeInvite,
} from '@/features/ledgers/hooks'
import { ConfirmSheet } from '@/ui/ConfirmSheet'
import { shareOrCopy, type ShareResult } from '@/ui/share'
import { CheckIcon, PlusIcon } from '@/ui/icons'
import type { LedgerInvite, LedgerMember } from '@/services/types'

/**
 * Which spaces you can work in, and — in the one you own — who else is in it.
 *
 * A list rather than a panel of buttons. Everything here is a space, a person or
 * an invitation — one row each, its single action on the right — so reading it
 * answers "who can see my money" before anything is tapped.
 *
 * The switcher only appears once there is a choice to make. A person using this
 * alone should never meet the concept: one ledger, no list, nothing to pick.
 *
 * The roster is the owner's view. Somebody who was let into a space already sees
 * whose it is, one group above, and a list of two rows repeating that under a
 * heading of its own said the same thing twice.
 *
 * Inviting and removing are the owner's alone, so a member is shown neither.
 * That is politeness rather than protection — the rules that matter live where
 * the invite is minted and where access is checked, and a member who wants
 * either will not be asking this screen for permission.
 */
export function LedgerSection() {
  const { ledgers, ledgerId, current, switchTo } = useActiveLedger()
  const members = useMembers(ledgerId)
  const invites = useInvites(ledgerId)
  const create = useCreateInvite(ledgerId)
  const revoke = useRevokeInvite(ledgerId)
  const remove = useRemoveMember(ledgerId)

  const [sent, setSent] = useState<ShareResult | null>(null)
  const [removing, setRemoving] = useState<LedgerMember | null>(null)

  /**
   * The token of the invite minted in this sheet.
   *
   * It arrives once, in the response that created it, and the server keeps only
   * a digest — so an invite read back later has no token to share. Holding it
   * here keeps the link shareable for as long as the screen is open; after that
   * the way to get one is to revoke and mint another, which is also the right
   * thing to do with a link that went to the wrong person.
   */
  const [minted, setMinted] = useState<{ id: string; token: string } | null>(null)

  const live = (invites.data ?? []).filter(usable)
  const people = members.data ?? []
  const owner = canInvite(current)

  /**
   * Two lists, because a space you own and a space somebody let you into are not
   * the same kind of thing and are not read the same way. Yours is known by its
   * name; theirs by whose it is — which is also what tells two spaces called the
   * same thing apart, and they will be, since nobody has ever named one.
   */
  const mine = ledgers.filter((ledger) => ledger.role === 'owner')
  const joined = ledgers.filter((ledger) => ledger.role === 'member')

  /**
   * Catches the token on its way past, and does not share it.
   *
   * Sharing here would be the obvious thing and would not work: `navigator.share`
   * needs a gesture, and by the time the invite comes back from the network the
   * tap that asked for it has expired. So the row grows a share button and the
   * person taps that — which is a real gesture, and also lets them decide who
   * gets the link.
   */
  function minting(invite: LedgerInvite) {
    if (invite.token === null) return

    setMinted({ id: invite.id, token: invite.token })
  }

  async function share(token: string) {
    setSent(
      await shareOrCopy({
        url: inviteUrl(token),
        title: 'Conta Gorda',
        message: 'Estou te convidando para participar da minha Conta Gorda.',
      }),
    )
  }

  return (
    <section className="grid">
      {ledgers.length > 1 && (
        <>
          <GroupLabel>Espaços</GroupLabel>

          {mine.map((ledger) => (
            <Row key={ledger.id} onClick={() => switchTo(ledger.id)}>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium text-ink">
                  {ledger.name}
                </span>
                <span className="block text-xs text-muted">
                  {ledger.member_count === 1 ? 'só você' : `você e mais ${ledger.member_count - 1}`}
                </span>
              </span>

              {ledger.id === ledgerId && <CheckIcon className="size-4 shrink-0 text-accent" />}
            </Row>
          ))}

          {joined.length > 0 && <GroupLabel>Compartilhado comigo</GroupLabel>}

          {joined.map((ledger) => (
            <Row key={ledger.id} onClick={() => switchTo(ledger.id)}>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium text-ink">
                  {ledger.owner_name ?? ledger.name}
                </span>
                <span className="block truncate text-xs text-muted">{ledger.owner_email}</span>
              </span>

              {ledger.id === ledgerId && <CheckIcon className="size-4 shrink-0 text-accent" />}
            </Row>
          ))}
        </>
      )}

      {owner && <GroupLabel>Quem tem acesso</GroupLabel>}

      {owner && people.map((person) => (
        <div key={person.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] text-ink">
              {person.you ? `${person.name} (você)` : person.name}
            </span>

            <span className="block truncate text-xs text-muted">{person.email}</span>
          </span>

          {person.role === 'owner' && (
            <span className="shrink-0 text-xs text-muted">criou este espaço</span>
          )}

          {person.role !== 'owner' && (
            <button
              type="button"
              onClick={() => setRemoving(person)}
              className="shrink-0 text-sm font-semibold text-out"
            >
              Remover
            </button>
          )}
        </div>
      ))}

      {owner &&
        live.map((invite) => (
        <div key={invite.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] text-ink">Convite pendente</span>
            <span className="block truncate text-xs text-muted">
              Vale até {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
              {shareable(invite, minted) !== null ? (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => share(shareable(invite, minted)!)}
                    className="text-accent"
                  >
                    {label(sent)}
                  </button>
                </>
              ) : (
                ' · link já enviado'
              )}
            </span>
          </span>

          <button
            type="button"
            onClick={() => revoke.mutate(invite.id)}
            disabled={revoke.isPending}
            className="shrink-0 text-sm font-semibold text-out"
          >
            Revogar
          </button>
        </div>
      ))}

      {create.isError && (
        <p role="alert" className="px-4 py-1 text-xs text-out">
          Não deu para criar o convite. Tente de novo.
        </p>
      )}

      {owner && live.length === 0 && (
        <Row onClick={() => create.mutate(undefined, { onSuccess: minting })}>
          <span className="text-[0.9375rem] text-ink">
            {create.isPending ? 'Criando convite…' : 'Convidar alguém'}
          </span>
          <PlusIcon className="size-4 shrink-0 text-muted" />
        </Row>
      )}

      {removing && (
        <ConfirmSheet
          danger
          title={`Remover ${removing.name}?`}
          message="Ela perde o acesso a este espaço. Os lançamentos que criou continuam aqui — o histórico é do espaço, não de quem digitou."
          confirmLabel="Remover"
          pending={remove.isPending}
          onClose={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
        />
      )}
    </section>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[0.6875rem] font-medium tracking-[0.08em] text-faint uppercase">
      {children}
    </p>
  )
}

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left"
    >
      {children}
    </button>
  )
}

function label(sent: ShareResult | null): string {
  if (sent === 'copied') return 'link copiado'

  if (sent === 'failed') return 'não deu para compartilhar'

  return 'compartilhar'
}

/**
 * The token to share for this invite, when there is one to share.
 *
 * Null for an invite that was read back from the server rather than minted
 * here: only its digest is stored, so the link cannot be rebuilt.
 */
function shareable(invite: LedgerInvite, minted: { id: string; token: string } | null) {
  if (invite.token !== null) return invite.token

  return minted !== null && minted.id === invite.id ? minted.token : null
}

function usable(invite: LedgerInvite): boolean {
  return (
    invite.revoked_at === null &&
    invite.accepted_at === null &&
    invite.expires_at > new Date().toISOString()
  )
}
