import { Avatar } from '../../../ui/Avatar'
import { ChevronRightIcon, SearchIcon, BellIcon, WalletIcon } from '../../../ui/icons'

interface IdentityRowProps {
  name: string
  avatarUrl: string | null
  onOpenProfile: () => void
  onOpenAccounts: () => void
}

/**
 * Who you are, and the ways out of this screen.
 *
 * It replaces the greeting. "Boa noite, Thadeu" is warm and says nothing on the
 * second visit; the reference spends that space on the identity itself, which is
 * also the control that opens the profile — so the same pixels greet you and do
 * something.
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
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4">
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

        <span className="truncate text-[0.9375rem] font-semibold text-ink">{name || 'Você'}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted" />
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-full bg-surface text-faint opacity-50"
        >
          <SearchIcon className="size-[1.125rem]" />
        </span>

        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-full bg-surface text-faint opacity-50"
        >
          <BellIcon className="size-[1.125rem]" />
        </span>

        <button
          type="button"
          onClick={onOpenAccounts}
          aria-label="Contas"
          className="grid size-10 place-items-center rounded-full bg-surface text-ink"
        >
          <WalletIcon className="size-[1.125rem]" />
        </button>
      </div>
    </header>
  )
}
