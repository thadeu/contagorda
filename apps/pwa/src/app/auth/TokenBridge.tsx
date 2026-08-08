import type { ReactNode } from 'react'
import { useGetToken } from '@clowk/react'
import { provideToken } from '@/services/http'

/**
 * Hands the API client a way to ask for a token.
 *
 * `services` is built at import time, above any React tree, so it cannot reach
 * a hook. This is the one component that bridges the two.
 *
 * The handover happens during render rather than in an effect. Effects run
 * child-first, so a query inside the tree could fire before this component's
 * effect had run, and that first request would go out unauthenticated. A parent
 * always renders before its children mount, which is exactly the ordering this
 * needs.
 *
 * Writing to a module from render is only safe because it is idempotent: the
 * same function, assigned again, with nothing observing the change.
 */
export function TokenBridge({ children }: { children: ReactNode }) {
  provideToken(useGetToken())

  return <>{children}</>
}
