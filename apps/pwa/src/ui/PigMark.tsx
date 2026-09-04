/**
 * The pig, without its tile.
 *
 * The app icon is the same drawing on a white rounded square. Here it sits
 * directly on whatever the screen is painting, so the square is left out and
 * the strokes stay dark: on the brand surface the pink head and cream snout
 * carry the mark, and the near-black outline reads as a shadow rather than a
 * line. Same file as the icon otherwise, so the two never drift apart.
 *
 * It blinks. Once every three seconds the eyes close and open, which is the
 * smallest thing that makes a drawing a character rather than a logo. Off
 * under `prefers-reduced-motion`: it is decoration, not information.
 */
export function PigMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="64 64 384 384" aria-hidden="true" className={className}>
      <g stroke="#0a0f1a" strokeWidth="26" strokeLinejoin="round" strokeLinecap="round">
        <rect x="96" y="92" width="92" height="132" rx="46" fill="#f7efe6" transform="rotate(-38 142 158)" />
        <rect x="324" y="92" width="92" height="132" rx="46" fill="#f7efe6" transform="rotate(38 370 158)" />
        <path
          d="M256 128 C338 128 392 186 400 262 C408 336 372 400 256 400 C140 400 104 336 112 262 C120 186 174 128 256 128 Z"
          fill="#f2748c"
        />
        <rect x="186" y="256" width="140" height="102" rx="51" fill="#f7efe6" />
      </g>
      <ellipse cx="228" cy="307" rx="13" ry="18" fill="#0a0f1a" />
      <ellipse cx="284" cy="307" rx="13" ry="18" fill="#0a0f1a" />
      <ellipse className="pig-eye" cx="204" cy="218" rx="12" ry="17" fill="#0a0f1a" />
      <ellipse className="pig-eye" cx="308" cy="218" rx="12" ry="17" fill="#0a0f1a" />
      <circle cx="158" cy="284" r="16" fill="#ffffff" opacity="0.28" />
      <circle cx="354" cy="284" r="16" fill="#ffffff" opacity="0.28" />
    </svg>
  )
}
