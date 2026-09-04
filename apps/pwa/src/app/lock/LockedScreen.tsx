import { useAuth } from '@clowk/react'
import { WelcomeFrame } from '@/app/auth/WelcomeFrame'
import { Button } from '@/ui/Button'
import { LockIcon } from '@/ui/icons'

/**
 * The door, held.
 *
 * The welcome frame under a sheet that cannot be swiped away: the only two
 * things to do are ask for the face again or leave the account. There is no
 * close button on purpose — a lock with a dismiss is a lock for people who do
 * not know about the dismiss.
 *
 * Signing out is the way past it for someone who cannot pass the check on
 * this phone any more. It ends the Clowk session, which lands on the welcome
 * screen, where a fresh sign-in is the normal way back in.
 */
export function LockedScreen({ onRetry }: { onRetry: () => void }) {
  const { signOut } = useAuth()

  return (
    <div className="relative h-full">
      <WelcomeFrame actions={null} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-title"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45"
      >
        <div className="w-full max-w-lg rounded-t-card bg-overlay px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-ink shadow-[0_-12px_40px_rgba(0,0,0,0.25)]">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-sunken text-ink">
            <LockIcon className="size-5" />
          </div>

          <h2 id="locked-title" className="pt-4 text-center text-lg font-bold">
            Não foi possível confirmar sua identidade
          </h2>
          <p className="mx-auto max-w-[30ch] pt-2 text-center text-sm text-muted">
            A biometria não foi autorizada. Tente de novo ou saia da conta para entrar de outro jeito.
          </p>

          <div className="grid gap-2 pt-6">
            <Button onClick={onRetry} className="w-full">
              Tentar de novo
            </Button>
            <Button variant="ghost" onClick={signOut} className="w-full">
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
