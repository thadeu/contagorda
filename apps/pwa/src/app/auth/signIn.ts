import { SubdomainResolver } from '@clowk/core'

/** Survives the round trip to Clowk, which a ref or state cannot. */
const ATTEMPT_KEY = 'contagorda:sign_in_attempt'

/**
 * Sends the browser to Clowk's sign-in page, coming back to the path the user
 * was on rather than always to the root — deep links stay usable through a
 * login.
 */
export async function redirectToSignIn(): Promise<void> {
  sessionStorage.setItem(ATTEMPT_KEY, '1')

  const base = await new SubdomainResolver().resolveUrl()
  const back = `${window.location.origin}${window.location.pathname}`

  window.location.href = `${base}/sign-in?redirect_uri=${encodeURIComponent(back)}`
}

/**
 * True when we already sent the user to sign in and they came back still
 * signed out.
 *
 * Without this the guard would bounce them straight out again, and a failing
 * exchange turns into an infinite redirect that looks like a frozen app rather
 * than an error.
 */
export function signInAlreadyAttempted(): boolean {
  return sessionStorage.getItem(ATTEMPT_KEY) === '1'
}

export function clearSignInAttempt(): void {
  sessionStorage.removeItem(ATTEMPT_KEY)
}
