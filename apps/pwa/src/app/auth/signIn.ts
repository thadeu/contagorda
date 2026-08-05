import { SubdomainResolver } from '@clowk/core'

/**
 * Sends the browser to Clowk, coming back to the path the user was on rather
 * than always to the root — a deep link stays usable through a login.
 */
export function redirectToSignIn(): Promise<void> {
  return go('sign-in')
}

export function redirectToSignUp(): Promise<void> {
  return go('sign-up')
}

async function go(path: 'sign-in' | 'sign-up'): Promise<void> {
  const base = await new SubdomainResolver().resolveUrl()
  const back = `${window.location.origin}${window.location.pathname}`

  window.location.href = `${base}/${path}?redirect_uri=${encodeURIComponent(back)}`
}
