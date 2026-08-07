/**
 * A tap you feel, where the platform allows one.
 *
 * There is no haptics API on the web. `navigator.vibrate` exists and works on
 * Android; Safari has never shipped it, on iOS or anywhere, so on the device
 * this app is built for the honest answer is that the browser cannot buzz on
 * demand.
 *
 * What iOS does have is one control that is wired to the taptic engine by the
 * system: the switch-styled checkbox added in 17.4. Toggling one produces the
 * same tick the native switch makes, and toggling it from script inside a
 * gesture appears to produce it too. "Appears to" is the whole caveat — it is
 * undocumented, it is not a promise, and it is the sort of thing a Safari
 * release can take away without anybody filing a bug. It is used here because
 * the failure mode is nothing happening, which is exactly where we started.
 *
 * So this is a request, not a call. Nothing above it should branch on whether it
 * worked, and nothing should be communicated by feel alone — the selection is
 * already said by the centre column, the colour and the figure. The buzz is
 * confirmation of something already on screen, which is the only thing haptics
 * should ever be.
 *
 * The native iOS app gets `UIImpactFeedbackGenerator` and none of this.
 */

/** Short enough to read as a tick rather than as an alert. */
const MS = 8

let control: HTMLInputElement | null = null

/**
 * One element, made on first use and kept. Building it per tap would put a node
 * into the document on every scroll that settles, and the browser is entitled to
 * be slow about that.
 */
function iosControl(): HTMLInputElement {
  if (control) return control

  control = document.createElement('input')
  control.type = 'checkbox'
  control.setAttribute('switch', '')
  control.setAttribute('aria-hidden', 'true')
  control.tabIndex = -1
  control.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;opacity:0;pointer-events:none;appearance:none'

  document.body.append(control)

  return control
}

/** A single light tick. For a selection changing, and nothing heavier. */
export function tick(): void {
  if (typeof navigator === 'undefined') return

  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(MS)

    return
  }

  try {
    iosControl().click()
  } catch {
    /* No haptics here. Nothing above this cares. */
  }
}
