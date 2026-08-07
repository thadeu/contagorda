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
/**
 * A placeholder that is exactly as tall as the text it replaces.
 *
 * The height comes from a copy of that text, rendered invisible and left in the
 * layout; the bar is laid over it. Guessing at a height in `rem` is how a
 * skeleton ends up a few pixels short of the real thing, and a few pixels short
 * is the whole screen stepping up and down every time something loads.
 *
 * The `sample` is not read by anyone — it exists to be measured. What matters is
 * that it carries the same font, size, weight and line height as the real value.
 *
 * Give it type, not spacing. Padding on this element lands inside the box the
 * bar is positioned against, and the bar comes out taller than the text it is
 * standing in for; put the margins on whatever wraps it.
 */
export function SkeletonText({
  sample,
  className = '',
  bar = 'w-44',
}: {
  sample: string
  className?: string
  bar?: string
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span aria-hidden="true" className="invisible">
        {sample}
      </span>

      <Skeleton className={`absolute inset-y-[0.12em] left-0 ${bar}`} />
    </span>
  )
}

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
