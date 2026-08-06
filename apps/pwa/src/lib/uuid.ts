/**
 * A v4 uuid that works outside a secure context.
 *
 * `crypto.randomUUID` is only defined over https or on localhost. The phone
 * loads the dev server from a LAN address over plain http, so on the device it
 * is `undefined` — and every create threw there while working perfectly on the
 * desktop, which is the shape of bug that costs an afternoon.
 *
 * `crypto.getRandomValues` carries no such restriction and is what the fallback
 * uses, so the ids are still random rather than merely unique-looking.
 *
 * This is for the mock. Real ids are minted by Postgres as uuidv7, because they
 * have to be ordered by time and a client cannot be trusted to say when
 * something happened.
 */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
