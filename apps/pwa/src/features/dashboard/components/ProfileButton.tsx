import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '@clowk/react'
import { useGreeting, useUpdateProfile } from '../../../app/useGreeting'
import { Avatar } from '../../../ui/Avatar'
import { Button } from '../../../ui/Button'
import { BottomSheet } from '../../../ui/BottomSheet'
import { ChevronRightIcon, SignOutIcon } from '../../../ui/icons'
import { LedgerSection } from '../../ledgers/components/LedgerSection'

interface ProfileButtonProps {
  name: string
  email: string
  avatarUrl: string | null
}

/**
 * The avatar is the way to everything about you.
 *
 * Once sign-in is required there has to be a sign-out, and the face in the
 * corner is where people already look for it — burying it in a settings screen
 * that does not otherwise exist would be inventing a screen to hold one button.
 */
export function ProfileButton({ name, email, avatarUrl }: ProfileButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sua conta"
        aria-haspopup="dialog"
        className="rounded-full"
      >
        <Avatar name={name} url={avatarUrl} />
      </button>

      {open && (
        <ProfileSheet
          name={name || 'Sua conta'}
          email={email}
          avatarUrl={avatarUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

interface ProfileSheetProps {
  name: string
  email: string
  avatarUrl?: string | null
  onClose: () => void
}

/**
 * A menu, not a form.
 *
 * It used to open straight onto the name field with sign-out beside it, which
 * put an edit box and the way out of the app on the same plane. This lists what
 * there is — you, the people in this space, and leaving — and each row opens
 * where it belongs.
 *
 * Sign-out sits alone under a divider. It is the only row that ends the session,
 * and the gap is the whole warning it needs.
 */
export function ProfileSheet({ name, email, avatarUrl = null, onClose }: ProfileSheetProps) {
  const { signOut } = useAuth()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <BottomSheet title={name} subtitle={email} onClose={onClose}>
        <MenuRow onClick={() => setEditing(true)}>
          <span className="text-[0.9375rem] font-medium text-ink">Perfil</span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted" />
        </MenuRow>

        <p className="px-4 pt-3 pb-1 text-[0.6875rem] font-medium tracking-[0.08em] text-faint uppercase">
          Usuários
        </p>

        <LedgerSection />

        <hr className="my-2 border-line opacity-30" />

        <MenuRow onClick={signOut}>
          <span className="text-[0.9375rem] font-medium text-out">Sair</span>
          <SignOutIcon className="size-4 shrink-0 text-out" />
        </MenuRow>
      </BottomSheet>

      {editing && (
        <ProfileFormSheet
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}

/**
 * The one thing about yourself this app holds.
 *
 * The face and the address sit above the field as a heading rather than as rows
 * of their own: they come from the account that signed you in, and only the name
 * below them is ours to change. Showing them as a header says that without
 * needing a sentence to explain it.
 */
function ProfileFormSheet({
  name,
  email,
  avatarUrl,
  onClose,
}: {
  name: string
  email: string
  avatarUrl: string | null
  onClose: () => void
}) {
  const { name: currentName } = useGreeting()
  const update = useUpdateProfile()
  const [draft, setDraft] = useState(currentName)

  const trimmed = draft.trim()
  const unchanged = trimmed === currentName.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (trimmed === '' || unchanged) {
      return
    }

    update.mutate(trimmed, { onSuccess: onClose })
  }

  return (
    <BottomSheet title="Perfil" onClose={onClose}>
      <div className="flex flex-col items-center gap-2 px-4 pb-5">
        <span className="rounded-full bg-gradient-to-br from-[#f0475f] via-[#b06cf5] to-[#4fb0f7] p-[3px]">
          <span className="block rounded-full bg-overlay p-[3px]">
            <Avatar name={name} url={avatarUrl} />
          </span>
        </span>

        <p className="truncate text-sm text-muted">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2 px-4">
        <label className="block rounded-control bg-sunken px-4 py-3">
          <span className="block pb-0.5 text-xs text-muted">Nome</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Como quer ser chamado"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
        </label>

        <Button
          type="submit"
          className="w-full"
          disabled={update.isPending || unchanged || trimmed === ''}
        >
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </BottomSheet>
  )
}

function MenuRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
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
