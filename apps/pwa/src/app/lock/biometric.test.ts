import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disableBiometric,
  enrollBiometric,
  fromBase64Url,
  isBiometricAvailable,
  isBiometricEnabled,
  toBase64Url,
  verifyBiometric,
} from './biometric'

describe('biometric lock', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is off until somebody turns it on', () => {
    expect(isBiometricEnabled()).toBe(false)
  })

  it('reports unavailable when the API is absent, without throwing', async () => {
    await expect(isBiometricAvailable()).resolves.toBe(false)
  })

  it('stores the credential id on enrolment and forgets it when disabled', async () => {
    const rawId = new Uint8Array([1, 2, 3, 4]).buffer

    vi.stubGlobal('navigator', { credentials: { create: vi.fn().mockResolvedValue({ rawId }) } })

    await expect(enrollBiometric('Thadeu')).resolves.toBe(true)
    expect(isBiometricEnabled()).toBe(true)

    disableBiometric()
    expect(isBiometricEnabled()).toBe(false)
  })

  it('swallows an enrolment failure and stays off', async () => {
    vi.stubGlobal('navigator', {
      credentials: { create: vi.fn().mockRejectedValue(new DOMException('nope', 'NotAllowedError')) },
    })

    await expect(enrollBiometric('Thadeu')).resolves.toBe(false)
    expect(isBiometricEnabled()).toBe(false)
    expect(console.warn).toHaveBeenCalled()
  })

  it('lets the session through when verification is unavailable', async () => {
    localStorage.setItem('contagorda:biometric', toBase64Url(new Uint8Array([9, 9])))
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn().mockRejectedValue(new Error('authenticator gone')) },
    })

    await expect(verifyBiometric()).resolves.toBe('unavailable')
    expect(console.warn).toHaveBeenCalled()
  })

  it('holds the door when the person closes or fails the prompt', async () => {
    localStorage.setItem('contagorda:biometric', toBase64Url(new Uint8Array([9, 9])))
    vi.stubGlobal('navigator', {
      credentials: {
        get: vi.fn().mockRejectedValue(new DOMException('cancelled', 'NotAllowedError')),
      },
    })

    await expect(verifyBiometric()).resolves.toBe('refused')
  })

  it('treats an empty assertion as a refusal', async () => {
    localStorage.setItem('contagorda:biometric', toBase64Url(new Uint8Array([9, 9])))
    vi.stubGlobal('navigator', { credentials: { get: vi.fn().mockResolvedValue(null) } })

    await expect(verifyBiometric()).resolves.toBe('refused')
  })

  it('passes on an assertion', async () => {
    localStorage.setItem('contagorda:biometric', toBase64Url(new Uint8Array([9, 9])))
    vi.stubGlobal('navigator', { credentials: { get: vi.fn().mockResolvedValue({ rawId: new ArrayBuffer(2) }) } })

    await expect(verifyBiometric()).resolves.toBe('passed')
  })

  it('is unavailable with no stored credential', async () => {
    await expect(verifyBiometric()).resolves.toBe('unavailable')
  })

  it('round-trips a credential id through base64url', () => {
    const bytes = new Uint8Array([0, 250, 255, 62, 63, 1])

    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
  })
})
