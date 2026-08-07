/**
 * A tap you feel, where the platform allows one — which, on the platform this
 * app was built for, is nowhere.
 *
 * There is no haptics API on the web. `navigator.vibrate` exists and works on
 * Android; Safari has never shipped it, on iOS or anywhere, and an installed PWA
 * is Safari.
 *
 * The one iOS opening we tried was the switch-styled checkbox added in 17.4,
 * which the system wires to the taptic engine: toggling one by hand produces the
 * tick a native switch makes, and the hope was that toggling it from script
 * would too. **It does not.** Tested in the installed app on the device, in the
 * gesture handler, with the element in the document — nothing. The engine is
 * reached by the control being touched, not by its state changing, and script
 * cannot fake being touched.
 *
 * That code is gone rather than kept behind a comment. A hack that does nothing
 * is worse than no hack: it reads as working to whoever finds it next, and the
 * only way to learn otherwise is to hold a phone and notice an absence.
 *
 * So this is a request, not a call. Nothing above it branches on whether it
 * worked, and nothing is ever communicated by feel alone — on the history chart
 * the month is already said by the lit column, the figure and the label. On
 * Android the buzz arrives; on iPhone the app is exactly as it was.
 *
 * Real haptics on iOS need `UIImpactFeedbackGenerator`, which needs the native
 * app. It is the clearest thing the web version cannot do that the native one
 * can, and worth remembering when that decision comes up.
 */

/** Short enough to read as a tick rather than as an alert. */
const MS = 8

/** A single light tick. For a selection changing, and nothing heavier. */
export function tick(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return

  navigator.vibrate(MS)
}
