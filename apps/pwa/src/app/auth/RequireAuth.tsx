import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '@clowk/react'
import { Button } from '../../ui/Button'
import { clearSignInAttempt, redirectToSignIn, signInAlreadyAttempted } from './signIn'

/**
 * Everything behind a sign-in.
 *
 * The wait matters as much as the redirect. On boot the provider tries to
 * rebuild the session from the stored refresh token, and bouncing to Clowk
 * before that settles would push a signed-in user through login every time they
 * opened the app.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn, isLoading } = useAuth()
  const started = useRef(false)

  // Coming back from Clowk still signed out means the exchange failed.
  // Redirecting again would loop, and a loop reads as a frozen app rather than
  // as something that went wrong.
  const failed = !isLoading && !signedIn && signInAlreadyAttempted()

  useEffect(() => {
    if (isLoading || started.current) return

    if (signedIn) {
      clearSignInAttempt()

      return
    }

    if (signInAlreadyAttempted()) return

    started.current = true
    void redirectToSignIn()
  }, [isLoading, signedIn])

  if (failed) {
    return (
      <Centered>
        <p className="text-lg font-semibold">Não deu para entrar</p>
        <p className="max-w-xs pt-1 text-sm text-muted">
          A sessão não foi concluída. Tente de novo.
        </p>
        <Button
          className="mt-5"
          onClick={() => {
            clearSignInAttempt()
            void redirectToSignIn()
          }}
        >
          Tentar de novo
        </Button>
      </Centered>
    )
  }

  if (isLoading || !signedIn) {
    return (
      <Centered>
        <p className="text-sm text-muted">Entrando…</p>
      </Centered>
    )
  }

  return <>{children}</>
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  )
}
