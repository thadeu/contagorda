/**
 * Work in progress, next to the thing being worked on.
 *
 * It appears beside a figure that is already on screen — the previous answer,
 * still true until the new one arrives — so it never stands in for content. That
 * is the whole difference from a skeleton: a skeleton replaces the screen with
 * its own outline and the app goes blank for a moment; this leaves the last
 * answer where it was and admits, quietly, that it is being checked.
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
      className={`inline-block size-[0.9em] animate-spin rounded-full border-2 border-current border-t-transparent opacity-40 ${className}`}
    />
  )
}
