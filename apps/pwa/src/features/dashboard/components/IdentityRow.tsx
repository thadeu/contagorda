import { Avatar } from '@/ui/Avatar'
import { ChevronRightIcon, SearchIcon, BellIcon, WalletIcon } from '@/ui/icons'
import { useActiveLedger } from '@/app/ledger/activeLedgerContext'
import type { Ledger } from '@/services/types'

interface IdentityRowProps {
  name: string
  avatarUrl: string | null
  onOpenProfile: () => void
  onOpenAccounts: () => void
}

/**
 * Which space you are working in, and the ways out of this screen.
 *
 * It replaces the greeting. "Boa noite, Thadeu" is warm and says nothing on the
 * second visit; the reference spends that space on the identity itself, which is
 * also the control that opens the profile — so the same pixels greet you and do
 * something.
 *
 * It used to name the person, and on a shared space that was the wrong answer to
 * the question people actually ask here. Somebody reading it on their own phone,
 * in a space their partner owns, saw their own name at the top and read it as
 * "this is my space" — while every entry they typed was landing in the shared
 * one. The name of the person signed in is never in doubt; the space is, and it
 * is the one that decides where the money goes.
 *
 * So the row names the space and says which kind it is. The avatar stays: this
 * is still the way into the profile, and a face is what people reach for.
 *
 * The ring around the avatar is the one warm thing on a near-black screen, and
 * it borrows the colours of the cards below so the two read as one palette
 * rather than two decisions. The gap inside it is the page colour, not a
 * shrunken photo — a gradient touching the image directly reads as a coloured
 * fringe on the face.
 *
 * Search and notifications are here because the layout was asked for, and they
 * do nothing because there is nothing behind them yet. They are dimmed so the
 * row can be judged as a shape without either of them being mistaken for a
 * working feature.
 */
export function IdentityRow({
  name,
  avatarUrl,
  onOpenProfile,
  onOpenAccounts,
}: IdentityRowProps) {
  const { current } = useActiveLedger()

  return (
    <header className="flex items-center justify-between gap-3 px-3.5 pt-[calc(env(safe-area-inset-top)+0.1rem)] pb-4">
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex min-w-0 items-center gap-2.5 rounded-full bg-surface py-1.5 pr-3 pl-1.5"
      >
        <span className="rounded-full bg-gradient-to-br from-[#f0475f] via-[#b06cf5] to-[#4fb0f7] p-[2px]">
          <span className="block rounded-full bg-surface p-[2px]">
            <Avatar name={name} url={avatarUrl} />
          </span>
        </span>

        <span className="min-w-0 text-left">
          <span className="block truncate text-[0.9375rem] font-semibold text-ink">
            {spaceName(current) || name || 'Você'}
          </span>
          <span className="block truncate text-xs text-muted">{spaceKind(current)}</span>
        </span>

        <ChevronRightIcon className="size-4 shrink-0 text-muted" />
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-2xl bg-surface text-faint opacity-50"
        >
          <SearchIcon className="size-[1.125rem]" />
        </span>

        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-2xl bg-surface text-faint opacity-50"
        >
          <BellIcon className="size-[1.125rem]" />
        </span>

        <button
          type="button"
          onClick={onOpenAccounts}
          aria-label="Contas"
          className="grid size-10 place-items-center rounded-2xl bg-surface text-ink"
        >
          <WalletIcon className="size-[1.125rem]" />
        </button>
      </div>
    </header>
  )
}

/**
 * What to call the active space.
 *
 * A space somebody let you into is named for whose it is, not for the name they
 * gave it: that name was chosen for their own list, where it was the only one,
 * and here it sits under the face of whoever is holding the phone. Yours keeps
 * its own name, which is the point of having one.
 */
function spaceName(ledger: Ledger | null): string {
  if (!ledger) return ''

  return ledger.role === 'member' ? (ledger.owner_name ?? ledger.name) : ledger.name
}

/**
 * Shared means more than one person can see it, whoever owns it. That is the
 * distinction that matters to somebody about to type an amount — not who holds
 * the title to the space, but whether what they enter will be read by anyone
 * else.
 */
function spaceKind(ledger: Ledger | null): string {
  if (!ledger) return ''

  return ledger.member_count > 1 ? 'compartilhado' : 'pessoal'
}
