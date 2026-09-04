import type { ReactNode } from 'react'
import { useAuth } from '@clowk/react'
import { WelcomeScreen } from './WelcomeScreen'
import { SplashScreen } from './SplashScreen'
import { BiometricGate } from '@/app/lock/BiometricGate'

/**
 * Everything behind a sign-in.
 *
 * The wait before showing anything is the important part. On boot the provider
 * rebuilds the session from the stored refresh token, and rendering the welcome
 * screen before that settles would flash a login at someone who is already
 * signed in every time they opened the app — the exact thing the refresh token
 * exists to prevent.
 *
 * The splash wears the welcome screen's background so the two do not flash
 * against each other on the way through.
 *
 * The biometric gate comes after the session, never instead of it: a face is
 * asked for only once Clowk has said who this is, and a face that is refused
 * or unavailable changes nothing about that answer.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn, isLoading } = useAuth()

  if (isLoading) return <SplashScreen />

  if (!signedIn) return <WelcomeScreen />

  return <BiometricGate>{children}</BiometricGate>
}
