import type { ReactNode } from 'react'
import { useAuth } from '@clowk/react'
import { WelcomeScreen } from './WelcomeScreen'
import { SplashScreen } from './SplashScreen'

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
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn, isLoading } = useAuth()

  if (isLoading) return <SplashScreen />

  if (!signedIn) return <WelcomeScreen />

  return <>{children}</>
}
