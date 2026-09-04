import { useEffect, useState, type ReactNode } from 'react'
import { verifyBiometric, isBiometricEnabled } from './biometric'
import { gateState } from './gateState'
import { LockedScreen } from './LockedScreen'
import { SplashScreen } from '@/app/auth/SplashScreen'

type Phase = 'open' | 'checking' | 'refused'

/**
 * Once per launch, and only if the switch is on.
 *
 * Sits behind `RequireAuth`, so it only ever sees a signed-in session, and
 * shows the splash while the phone asks for a face — the app has not opened
 * yet, and the splash is what "not yet" looks like here.
 *
 * `gateState.unlocked` is module state rather than storage: a reload asks
 * again, a re-render does not, and nothing survives to the next launch that
 * could let one through without asking.
 *
 * Only a refusal holds the door. A pass opens the app; an error opens it too,
 * after a line in the console, because Clowk signed this person in and a
 * biometric the phone cannot run must not undo that. Closing the prompt is
 * not an error — it is the answer "no", and the screen says so and asks
 * again.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() =>
    gateState.unlocked || !isBiometricEnabled() ? 'open' : 'checking',
  )

  useEffect(() => {
    if (phase !== 'checking') return

    let cancelled = false

    verifyBiometric()
      .then((result) => {
        if (cancelled) return

        if (result === 'refused') {
          setPhase('refused')

          return
        }

        gateState.unlocked = true
        setPhase('open')
      })
      .catch((error) => {
        console.warn('[biometric] check threw; continuing on the Clowk session', error)

        if (cancelled) return

        gateState.unlocked = true
        setPhase('open')
      })

    return () => {
      cancelled = true
    }
  }, [phase])

  if (phase === 'checking') return <SplashScreen />

  if (phase === 'refused') return <LockedScreen onRetry={() => setPhase('checking')} />

  return <>{children}</>
}
