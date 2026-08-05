import { useState } from 'react'
import { useAuth } from '@clowk/react'
import { Avatar } from '../../../ui/Avatar'
import { BottomSheet, SheetAction } from '../../../ui/BottomSheet'
import { SignOutIcon } from '../../../ui/icons'

interface ProfileButtonProps {
  name: string
  email: string
  avatarUrl: string | null
}

/**
 * The avatar is the way out.
 *
 * Once sign-in is required there has to be a sign-out, and the face in the
 * corner is where people already look for it — burying it in a settings screen
 * that does not otherwise exist would be inventing a screen to hold one button.
 */
export function ProfileButton({ name, email, avatarUrl }: ProfileButtonProps) {
  const { signOut } = useAuth()
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
        <BottomSheet title={name || 'Sua conta'} subtitle={email} onClose={() => setOpen(false)}>
          <SheetAction
            danger
            className="flex w-full items-center justify-center gap-2"
            onClick={signOut}
          >
            <SignOutIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Sair
          </SheetAction>
        </BottomSheet>
      )}
    </>
  )
}
