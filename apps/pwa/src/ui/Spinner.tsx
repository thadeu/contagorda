/**
 * Work in progress, next to the thing being worked on.
 *
 * It appears beside a figure that is already on screen — the previous answer,
 * still true until the new one arrives — so it never stands in for content. That
 * is the whole difference from a skeleton: a skeleton replaces the screen with
 * its own outline and the app goes blank for a moment; this leaves the last
 * answer where it was and admits, quietly, that it is being checked.
 *
 * Thin, small and in the accent rather than in the ink. It sits beside a figure
 * that is the point of the screen, and a heavy ring next to it competes for the
 * same glance; the accent says "the app is doing something" without pretending
 * to be another number. Sizing in `em` keeps it in proportion to whatever text
 * it is standing next to, which is the only reason it looks right at 2rem and
 * would also look right in a row.
 *
 * It keeps turning under `prefers-reduced-motion`. Everywhere else in the app
 * motion is decoration and is dropped on request, but here the movement is the
 * message: a still spinner is a glyph that says nothing.
 */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block size-[0.72em] animate-spin rounded-full border-[1.5px] border-accent border-t-transparent ${className}`}
    />
  )
}
