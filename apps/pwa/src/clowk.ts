import { configure } from '@clowk/core'

export const PUBLISHABLE_KEY = import.meta.env.VITE_CLOWK_PUBLISHABLE_KEY as string

/**
 * Set before anything renders. `SessionTokenResource` builds its URL from
 * `subdomainUrl`, and without it the client would resolve the instance through
 * api.clowk.dev on the path that restores the session — one more network hop,
 * and one more thing to be down, every time the app opens.
 */
export function configureClowk() {
  configure({
    publishableKey: PUBLISHABLE_KEY,
    subdomainUrl: import.meta.env.VITE_CLOWK_SUBDOMAIN_URL as string,
  })
}
