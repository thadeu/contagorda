import { useEffect, useRef } from 'react'

export type PigDrawingEffect = 'draw' | 'fade' | 'pop'

export interface PigDrawingProps {
  /** Milliseconds each part takes to appear. */
  duration?: number
  /** Milliseconds the finished pig stays on screen before the loop restarts. */
  hold?: number
  /** How a part arrives: traced by its outline, faded in, or popped in. */
  effect?: PigDrawingEffect
  /** Take the parts away again, last to first, before starting over. */
  reverse?: boolean
  className?: string
  label?: string
}

/**
 * The pig drawing itself, part by part, on a loop.
 *
 * A loader that is the mark rather than a ring next to it. Four parts arrive
 * in the order a child would draw them — face, ears, eyes, snout — the whole
 * pig holds for a beat, and it starts again. With `reverse` the parts leave
 * the way they came instead of vanishing all at once.
 *
 * Timing is data, not CSS. The app switches every stylesheet animation off,
 * and a sequence whose steps depend on props cannot be written as static
 * keyframes anyway; the Web Animations API takes the schedule as numbers and
 * the browser runs it off the main thread like any other animation. Every
 * part's timeline is one cycle long with the same offsets, so they can never
 * drift apart.
 *
 * Renders the finished pig when the browser cannot animate, so the fallback
 * is the mark, not a blank.
 */
export function PigDrawing({
  duration = 380,
  hold = 1200,
  effect = 'draw',
  reverse = false,
  className = '',
  label = 'Carregando',
}: PigDrawingProps) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current

    if (!svg || typeof svg.animate !== 'function') return

    const parts = Array.from(svg.querySelectorAll<SVGGElement>('[data-part]'))
    const steps = parts.length
    const total = steps * duration + hold + (reverse ? steps * duration + hold / 2 : 0)
    const animations: Animation[] = []

    parts.forEach((part, i) => {
      const enterAt = (i * duration) / total
      const enterEnd = ((i + 1) * duration) / total
      const leaveAt = reverse ? (steps * duration + hold + (steps - 1 - i) * duration) / total : 1
      const leaveEnd = reverse ? (steps * duration + hold + (steps - i) * duration) / total : 1

      const targets = effect === 'draw' ? Array.from(part.children) : [part]

      for (const el of targets) {
        animations.push(
          el.animate(keyframesFor(effect, el, { enterAt, enterEnd, leaveAt, leaveEnd }), {
            duration: total,
            iterations: Infinity,
            easing: 'linear',
            fill: 'both',
          }),
        )
      }
    })

    return () => animations.forEach((a) => a.cancel())
  }, [duration, hold, effect, reverse])

  return (
    <svg
      ref={ref}
      viewBox="64 64 384 384"
      role="status"
      aria-label={label}
      className={`pig-drawing ${className}`}
    >
      <g data-part="face" stroke="#0a0f1a" strokeWidth="26" strokeLinejoin="round" strokeLinecap="round">
        <path
          pathLength="1"
          d="M256 128 C338 128 392 186 400 262 C408 336 372 400 256 400 C140 400 104 336 112 262 C120 186 174 128 256 128 Z"
          fill="#f2748c"
        />
      </g>
      <g data-part="ears" stroke="#0a0f1a" strokeWidth="26" strokeLinejoin="round" strokeLinecap="round">
        <rect pathLength="1" x="96" y="92" width="92" height="132" rx="46" fill="#f7efe6" transform="rotate(-38 142 158)" />
        <rect pathLength="1" x="324" y="92" width="92" height="132" rx="46" fill="#f7efe6" transform="rotate(38 370 158)" />
      </g>
      <g data-part="eyes">
        <ellipse cx="204" cy="218" rx="12" ry="17" fill="#0a0f1a" />
        <ellipse cx="308" cy="218" rx="12" ry="17" fill="#0a0f1a" />
        <circle cx="158" cy="284" r="16" fill="#ffffff" opacity="0.28" />
        <circle cx="354" cy="284" r="16" fill="#ffffff" opacity="0.28" />
      </g>
      <g data-part="mouth">
        <rect
          pathLength="1"
          x="186"
          y="256"
          width="140"
          height="102"
          rx="51"
          fill="#f7efe6"
          stroke="#0a0f1a"
          strokeWidth="26"
          strokeLinejoin="round"
        />
        <ellipse cx="228" cy="307" rx="13" ry="18" fill="#0a0f1a" />
        <ellipse cx="284" cy="307" rx="13" ry="18" fill="#0a0f1a" />
      </g>
    </svg>
  )
}

interface Cycle {
  enterAt: number
  enterEnd: number
  leaveAt: number
  leaveEnd: number
}

/**
 * One cycle for one element: hidden, arriving, shown, (leaving,) hidden.
 *
 * The ears are drawn on top of the face, so while they are hidden they must
 * not cover it — every effect ends its "hidden" state fully transparent, and
 * `draw` traces the outline before the fill comes up so the head does not
 * fill in as a flat blob and then get its edge.
 *
 * Without `reverse` the part simply stays until the cycle wraps and every
 * part resets at once; the frames after `leaveAt` are then left out rather
 * than squeezed into the last millisecond.
 */
function keyframesFor(effect: PigDrawingEffect, el: Element, w: Cycle): Keyframe[] {
  const { enterAt, enterEnd, leaveAt, leaveEnd } = w
  const stroked = effect === 'draw' && el.hasAttribute('pathLength')
  const leaves = leaveAt < 1

  let hidden: Keyframe
  let shown: Keyframe
  let arriving: Keyframe[]

  if (stroked) {
    const base = { strokeDasharray: 1 }

    hidden = { ...base, strokeDashoffset: 1, fillOpacity: 0, opacity: 0 }
    shown = { ...base, strokeDashoffset: 0, fillOpacity: 1, opacity: 1 }
    arriving = [
      { offset: enterAt, ...base, strokeDashoffset: 1, fillOpacity: 0, opacity: 1 },
      { offset: enterAt + (enterEnd - enterAt) * 0.6, ...base, strokeDashoffset: 0, fillOpacity: 0, opacity: 1 },
    ]
  } else if (effect === 'pop') {
    hidden = { opacity: 0, transform: 'scale(0.4)' }
    shown = { opacity: 1, transform: 'scale(1)' }
    arriving = [{ offset: enterAt, ...hidden, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }]
  } else {
    hidden = { opacity: 0 }
    shown = { opacity: 1 }
    arriving = [{ offset: enterAt, ...hidden, easing: 'ease-out' }]
  }

  const frames: Keyframe[] = [
    { offset: 0, ...hidden },
    ...arriving,
    { offset: enterEnd, ...shown },
  ]

  if (leaves) {
    frames.push(
      { offset: leaveAt, ...shown, easing: 'ease-in' },
      { offset: leaveEnd, ...hidden },
      { offset: 1, ...hidden },
    )
  } else {
    frames.push({ offset: 1, ...shown })
  }

  return dedupe(frames)
}

function dedupe(frames: Keyframe[]): Keyframe[] {
  return frames.filter((f, i) => i === 0 || f.offset !== frames[i - 1].offset)
}
