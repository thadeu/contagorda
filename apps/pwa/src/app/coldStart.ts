/**
 * Tells a relaunch apart from a restore, and drops the remembered month on the
 * first of the two.
 *
 * The month lives in the URL so it survives a reload, which matters: an
 * installed PWA has its view discarded and restored by the system constantly,
 * and coming back to a different month than the one you left is the app losing
 * your place. That part stays.
 *
 * But it made opening the app in August land on March 2027, because the last
 * thing that happened before the app was closed was somebody browsing ahead.
 * A month you scrolled to is a place you went; it is not where the app lives,
 * and reopening an app is asking it where you are, not where you were.
 *
 * `sessionStorage` is what separates the two. iOS keeps it when it discards and
 * restores the page — same session, same tab — and clears it when the app is
 * killed and launched again. So an empty one means the person opened the app,
 * and a full one means the system reloaded it underneath them. There is no
 * better signal available to a web app; `performance.navigation` reports a
 * reload for both.
 *
 * It runs before React, on purpose. Rewriting the URL from inside a component
 * means one render at the remembered month — a chart that draws 2027, then
 * jumps — and the whole point is that the jump never happens.
 */
const KEY = 'contagorda:session'

export function forgetMonthOnColdStart(): void {
  /**
   * Storage throws rather than returning null in a locked-down browser. The
   * answer there is to leave the URL alone: a month that persists too eagerly is
   * a smaller wrong than a screen that will not load.
   */
  try {
    const restored = sessionStorage.getItem(KEY) !== null

    sessionStorage.setItem(KEY, '1')

    if (restored) return
  } catch {
    return
  }

  const url = new URL(window.location.href)

  if (!url.searchParams.has('month')) return

  url.searchParams.delete('month')
  history.replaceState(history.state, '', url)
}
