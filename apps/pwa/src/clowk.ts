import { configure } from '@clowk/core'

export const PUBLISHABLE_KEY = import.meta.env.VITE_CLOWK_PUBLISHABLE_KEY as string

/**
 * Set before anything renders.
 *
 * `subdomainUrl` is optional: the publishable key already identifies the
 * instance, and the SDK resolves the URL from it when nothing else says where
 * to go. Setting it is worth one fewer network hop on the path that opens the
 * app — the sign-in redirect and the session refresh both need that URL before
 * they can do anything — but a deployment that only carries the key works.
 *
 * `undefined` rather than an empty string when it is absent: the SDK treats a
 * falsy value as "not configured", and an empty string that got through would
 * build `//sessions/refresh`.
 */
export function configureClowk() {
  configure({
    publishableKey: PUBLISHABLE_KEY,
    subdomainUrl: import.meta.env.VITE_CLOWK_SUBDOMAIN_URL || undefined,
  })
}
