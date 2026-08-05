interface DaySpineProps {
  /** The day's net, in cents. Negative spends, positive earns. */
  netCents: number
  /** Largest absolute daily net in the month, for scaling. */
  peakCents: number
  today?: boolean
}

/**
 * The signature element: a paper statement's fold line, made to carry data.
 *
 * A hairline runs down the list, and each day's net grows out of it — right for
 * money in, left for money out, scaled against the month's biggest day. It
 * turns the list into something you can read at a glance without reading a
 * single figure, which is how people actually check a month: looking for the
 * days that stick out.
 *
 * Scaling is against the month's peak rather than a fixed value, so the shape
 * stays legible whether the month moved hundreds or tens of thousands.
 */
export function DaySpine({ netCents, peakCents, today = false }: DaySpineProps) {
  const ratio = peakCents === 0 ? 0 : Math.min(Math.abs(netCents) / peakCents, 1)

  // A floor of 6% keeps a small day visible as a mark rather than nothing at
  // all — "almost no movement" is information too.
  const width = `${Math.max(ratio * 50, netCents === 0 ? 0 : 6)}%`
  const inbound = netCents > 0

  return (
    <div className="relative h-1.5 w-full" aria-hidden="true">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hairline" />
      <div
        className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${
          inbound ? 'left-1/2 bg-in' : 'right-1/2 bg-out'
        } ${today ? 'opacity-100' : 'opacity-70'}`}
        style={{ width }}
      />
    </div>
  )
}
