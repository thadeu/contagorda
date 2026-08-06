export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed'

/**
 * Hands a link to the system, and falls back to the clipboard.
 *
 * On a phone this is the native sheet — WhatsApp, Messages, AirDrop — which is
 * where an invite to your partner is actually going. Rebuilding that as a list
 * of buttons in the app would be a worse copy of something the person already
 * knows, and it would miss whichever app they actually use.
 *
 * Dismissing the sheet rejects with `AbortError`, which is a person changing
 * their mind rather than a failure, and is reported as such — the difference
 * matters because one deserves an error message and the other deserves silence.
 *
 * Must be called straight from a tap: browsers refuse a share that is not tied
 * to a gesture, and an await before it can be enough to lose that.
 */
export async function shareOrCopy(url: string, title: string): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })

      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed'
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)

    return 'copied'
  } catch {
    return 'failed'
  }
}
