import { useSyncExternalStore } from 'react'

const KEY = 'contagorda:biometric'
const RP_NAME = 'Conta Gorda'

/**
 * Face ID or Touch ID in front of an app that is already signed in.
 *
 * This is a lock on the door, not a second key. Clowk owns the session and
 * nothing here touches it: the credential is a platform passkey whose
 * assertion is never sent anywhere, so all it proves is that the person
 * holding the phone can pass its biometric check. That is the threat it is
 * for — a phone left unlocked on a table — and it is honest about being no
 * more than that.
 *
 * Because it is only a door, a broken door must not become a wall. Every
 * technical failure — no API, no enrolled credential, an authenticator that
 * throws — logs and lets the session through, so a broken or missing
 * biometric leaves the app exactly as it was before the feature existed:
 * signed in by Clowk. The one thing that does hold the door is the person
 * not passing the check; see `verifyBiometric`.
 *
 * Off until somebody turns it on. The switch lives in the profile sheet and
 * the choice is per device, like the theme: it is the phone that has the
 * face, not the account.
 */

/** Whether the switch is on: a credential id is stored for this device. */
export function isBiometricEnabled(): boolean {
  return readCredentialId() !== null
}

/**
 * Whether this device can do it at all. Needs a secure context (the API is
 * simply absent over plain http) and a platform authenticator.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === 'undefined') return false

    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.warn('[biometric] availability check failed', error)

    return false
  }
}

/**
 * Registers a credential on this device and turns the lock on.
 *
 * The user handle and challenge are random and forgotten on purpose: no
 * server ever verifies this credential, so there is nothing to bind them to.
 * Resolves `false` rather than throwing when anything goes wrong, so a caller
 * can show the switch snapping back and nothing else.
 */
export async function enrollBiometric(userName: string): Promise<boolean> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        rp: { name: RP_NAME, id: window.location.hostname },
        user: {
          id: randomBytes(16),
          name: userName || 'conta',
          displayName: userName || 'Conta Gorda',
        },
        challenge: randomBytes(32),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null

    if (!credential) return false

    writeCredentialId(toBase64Url(new Uint8Array(credential.rawId)))

    return true
  } catch (error) {
    console.warn('[biometric] enrolment failed', error)

    return false
  }
}

export function disableBiometric(): void {
  writeCredentialId(null)
}

export type BiometricResult = 'passed' | 'refused' | 'unavailable'

/**
 * Asks for the face.
 *
 * Three answers, because the gate treats them differently. `passed` opens the
 * app. `refused` is the person: they closed the prompt, cancelled, or the
 * phone did not recognise them — WebAuthn reports all of those as
 * `NotAllowedError`, and a lock that opens on cancel is not a lock. Everything
 * else is `unavailable`: no API, no stored credential, a credential the phone
 * has since forgotten, an authenticator that threw. Those are the app's
 * problems, not the person's, and they let the Clowk session through.
 */
export async function verifyBiometric(): Promise<BiometricResult> {
  const id = readCredentialId()

  if (id === null) return 'unavailable'

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(id) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })

    if (assertion === null) {
      console.warn('[biometric] prompt returned nothing; treating as refused')

      return 'refused'
    }

    return 'passed'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      console.warn('[biometric] not authorised by the user', error)

      return 'refused'
    }

    console.warn('[biometric] verification unavailable; continuing on the Clowk session', error)

    return 'unavailable'
  }
}

/* The stored id, as a tiny external store so the switch re-renders. */

const listeners = new Set<() => void>()

function readCredentialId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function writeCredentialId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(KEY)
    } else {
      localStorage.setItem(KEY, id)
    }
  } catch (error) {
    console.warn('[biometric] could not persist the setting', error)
  }

  listeners.forEach((listener) => listener())
}

export function useBiometricEnabled(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
    isBiometricEnabled,
    () => false,
  )
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length))

  crypto.getRandomValues(bytes)

  return bytes
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}
