import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Puts an overlay at the end of the document instead of where it was written.
 *
 * Every sheet is declared inside the screen that opens it, which puts it inside
 * `main` — the element the app scrolls in. That parentage is the bug: when a
 * scroller inside a sheet reaches its end, the browser walks up the ancestors
 * looking for the next thing that can scroll, and finds the page behind the
 * sheet, because it genuinely is an ancestor. No amount of `overflow: hidden` or
 * cancelled touchmoves settles that reliably, since the relationship is real and
 * the chaining is correct behaviour.
 *
 * Portalling to the body removes the ancestor rather than arguing with it. It
 * also retires a trap that caught this codebase twice: `touch-action` and
 * `overflow` applied to the frame or the scroller used to reach into the sheets
 * themselves and disable them, because the sheets were inside.
 *
 * Nothing else changes. React events still propagate through the tree the
 * component was written in, so context, providers and handlers work exactly as
 * before — only the DOM position moves.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
