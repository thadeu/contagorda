export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed'

export interface Shareable {
  url: string
  /** Names the sheet itself. Most apps never show it. */
  title: string
  /** The line before the link. The link is placed by us, right under it. */
  message: string
}

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
 * Both of the modern calls are secure-context only, so on a plain-http origin
 * neither is defined and the whole thing falls through to `execCommand`.
 *
 * The link goes inside the text rather than in `url`, which is the only way to
 * control how the two are laid out. Passing both leaves the join to the
 * receiving app, and most of them concatenate with a space — the message and the
 * link arrive as one run-on line. Building the string here puts the link on its
 * own line, everywhere, because there is nothing left to decide.
 *
 * The cost is that a target which only understands links no longer gets one as a
 * link. That is a fair trade for a message someone can read: this is going to a
 * chat, not to a bookmark list.
 *
 * Must be called straight from a tap: browsers refuse a share that is not tied
 * to a gesture, and an await before it can be enough to lose that.
 */
export async function shareOrCopy({ url, title, message }: Shareable): Promise<ShareResult> {
  const text = `${message}\n\n${url}`

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text })

      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed'
      }
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)

      return 'copied'
    } catch {
      // Falls through to the old way rather than giving up here.
    }
  }

  return legacyCopy(text) ? 'copied' : 'failed'
}

/**
 * The copy that works without a secure context.
 *
 * Both `navigator.share` and `navigator.clipboard` are gated behind https, so on
 * a phone opening the dev server over plain http neither exists and the modern
 * path cannot run at all. `execCommand` is deprecated and still the only thing
 * that answers there — and a link nobody can copy is a sharing feature that does
 * not share.
 *
 * The textarea is off-screen rather than hidden: a `display: none` element
 * cannot be selected, so it copies nothing and reports success.
 */
function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea')

  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.top = '-1000px'
  document.body.appendChild(field)

  try {
    field.select()
    field.setSelectionRange(0, text.length)

    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}
