import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Lifts an overlay out of the scroller, and no further.
 *
 * Every sheet is declared inside the screen that opens it, which puts it inside
 * `main` — the element the app scrolls in. That parentage is a bug: when a
 * scroller inside a sheet reaches its end, the browser walks up the ancestors
 * looking for the next thing that can scroll and finds the page behind the
 * sheet, because it genuinely is an ancestor. No amount of `overflow: hidden` or
 * cancelled touchmoves settles that reliably, since the relationship is real and
 * the chaining is correct behaviour.
 *
 * The destination is `#root`, not the body. The body is one step too far: the
 * status-bar spacer sits ahead of the root and makes everything inside it one
 * safe-area inset taller than the viewport, which is what removes the band along
 * the bottom edge in the installed app. A sheet portalled past the root leaves
 * that arrangement and the band comes back with it — visible under the sheet,
 * only on the phone, which is the same trap in a new place.
 *
 * Out of the scroller is all the chaining fix needed. It also retires a trap
 * that caught this codebase twice: `touch-action` and `overflow` applied to the
 * frame or the scroller used to reach into the sheets themselves and disable
 * them, because the sheets were inside.
 *
 * Nothing else changes. React events still propagate through the tree the
 * component was written in, so context, providers and handlers work exactly as
 * before — only the DOM position moves.
 */
export function Portal({ children }: { children: ReactNode }) {
  const host = document.getElementById('root')

  if (!host) {
    return children
  }

  return createPortal(children, host)
}
