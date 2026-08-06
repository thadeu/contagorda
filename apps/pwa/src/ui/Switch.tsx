interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

/**
 * The platform's toggle, in its current shape: the knob is a capsule rather than
 * a circle. Measured off the system's own, side by side: the knob is three
 * quarters of the track's height and just under half its width — thirty by
 * twenty-three in a sixty-two by thirty-one track — with the same margin on all
 * four sides. Equal margins are what make it read as resting inside the track
 * rather than clipped to one edge of it, and at equal width and height a fully
 * rounded box is a circle however it is described — the height has to come down
 * for the shape to be an oval at all.
 *
 * The room it leaves is at the sides, which is where the travel lives: the
 * visible run of colour beside the knob says which way the switch is set before
 * the colour itself is read, which is the part that survives not seeing green.
 *
 * The shadow is nearly nothing — one point, barely dark. A knob that casts a
 * real shadow reads as a button sitting on top of the track instead of a part
 * of it. It is the one detail that dates a switch —
 * everything else about the control has been the same for a decade — and a round
 * knob beside the system's own reads as an older app.
 *
 * It reads as a state rather than as a choice.
 *
 * A checkbox asks to be ticked and looks unfinished until it is; a switch is
 * simply on or off, and off is a complete answer. That matters here — most rows
 * are entered before they are paid, so the resting state is the common one and
 * should not look like something left undone.
 *
 * It is a real `input[type=checkbox]` underneath, made invisible rather than
 * replaced, so focus, tabbing, screen readers and form semantics keep working
 * while it looks like the system's.
 *
 * Track and knob are both siblings of the input, not nested. `peer-checked`
 * compiles to a sibling combinator and reaches nothing inside another element —
 * a knob drawn inside the track simply never moves, and does so silently.
 *
 * The input carries an explicit width and height, not just `inset-0`. A checkbox
 * is a replaced element with an intrinsic size, so the insets alone leave it at
 * about sixteen points in the top-left corner — which is where the knob rests
 * when it is off, so the control appears to work and only responds under the
 * knob. It has to be told to fill.
 */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <span className="relative inline-flex h-[1.6em] w-[3.58rem] shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none opacity-0"
      />

      <span
        aria-hidden="true"
        className="switch-motion absolute inset-0 rounded-full bg-sunken peer-checked:bg-in peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
      />

      <span
        aria-hidden="true"
        className="switch-motion absolute top-[1.95px] left-[2px] h-[1.3375rem] w-[1.95rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22)] peer-checked:translate-x-[1.35rem]"
      />
    </span>
  )
}
