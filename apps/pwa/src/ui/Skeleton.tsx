/**
 * A shape standing in for something that has not arrived.
 *
 * It is not a spinner and not a zero. A spinner says "wait" and takes the space
 * the answer will need without saying anything about it; a zero is worse,
 * because R$ 0,00 is a perfectly good number and someone reading it has no way
 * to know it is a placeholder — for a minute the app claims a month with no
 * spending in it, which is the one wrong answer a finance app must never give
 * confidently.
 *
 * A block the size and shape of what is coming says the layout will not move,
 * and says nothing at all about the value.
 *
 * `bg-sunken` and not a colour of its own: it is a hole in the page, and a hole
 * is the surface behind the thing that is missing.
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`block animate-pulse rounded-chip bg-sunken motion-reduce:animate-none ${className}`}
    />
  )
}
