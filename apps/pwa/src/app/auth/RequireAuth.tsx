import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clowk/react'
import { Button } from '../../ui/Button'
import { clearSignInAttempt, redirectToSignIn, signInAlreadyAttempted } from './signIn'

/**
 * How long "signed out" has to hold before it counts as a failure.
 *
 * Coming back from Clowk there is a window where loading has finished but the
 * exchange has not landed yet, and under StrictMode the provider runs its
 * bootstrap twice — the first pass consumes the token from the URL, the second
 * finds none and falls back to the stored refresh token. Either way the app is
 * momentarily "not signed in", which is not the same thing as "sign-in failed".
 */
const SETTLE_MS = 1500

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
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (isLoading || started.current) return

    if (signedIn) {
      clearSignInAttempt()

      return
    }

    // Back from Clowk and still signed out. Give it a moment before calling it
    // a failure — redirecting again immediately would loop, and a loop reads as
    // a frozen app rather than as something that went wrong.
    if (signInAlreadyAttempted()) {
      const timer = setTimeout(() => setFailed(true), SETTLE_MS)

      return () => clearTimeout(timer)
    }

    started.current = true
    void redirectToSignIn()
  }, [isLoading, signedIn])

  if (failed && !signedIn) {
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
