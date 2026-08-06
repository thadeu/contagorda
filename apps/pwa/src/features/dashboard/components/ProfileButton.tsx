import { useState, type FormEvent } from 'react'
import { useAuth } from '@clowk/react'
import { useGreeting, useUpdateProfile } from '../../../app/useGreeting'
import { Avatar } from '../../../ui/Avatar'
import { Button } from '../../../ui/Button'
import { BottomSheet, SheetAction } from '../../../ui/BottomSheet'
import { SignOutIcon } from '../../../ui/icons'
import { LedgerSection } from '../../ledgers/components/LedgerSection'

interface ProfileButtonProps {
  name: string
  email: string
  avatarUrl: string | null
}

/**
 * The avatar is the way out, and the way to your name.
 *
 * Once sign-in is required there has to be a sign-out, and the face in the
 * corner is where people already look for it — burying it in a settings screen
 * that does not otherwise exist would be inventing a screen to hold one button.
 * The name sits in the same place for the same reason: it is the only thing
 * about yourself this app has to hold, and one field does not justify a screen.
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
        <ProfileSheet name={name || 'Sua conta'} email={email} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

interface ProfileSheetProps {
  name: string
  email: string
  onClose: () => void
}

/**
 * The email is shown and not editable. It is the identity Clowk signed you in
 * with, and letting it be typed over here would either lie or quietly break the
 * account it belongs to.
 */
function ProfileSheet({ name, email, onClose }: ProfileSheetProps) {
  const { signOut } = useAuth()
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
    <BottomSheet title={name} subtitle={email} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-2">
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
          {update.isPending ? 'Salvando…' : 'Salvar nome'}
        </Button>
      </form>

      <hr className="my-2 border-line" />

      <LedgerSection />

      <hr className="my-2 border-line" />

      <SheetAction
        danger
        className="flex w-full items-center justify-center gap-2"
        onClick={signOut}
      >
        <SignOutIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Sair
      </SheetAction>
    </BottomSheet>
  )
}
