import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The manifest is what tells iOS which URLs belong to the installed app. It is
 * a file nothing imports, so nothing else would notice it going missing or
 * losing a field — and the symptom is not a broken build, it is the app opening
 * the browser mid-navigation on someone's phone.
 */
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))

describe('manifest', () => {
  it('is linked from the document', () => {
    expect(readFileSync('index.html', 'utf8')).toContain('rel="manifest"')
  })

  it('scopes the whole app, so navigation stays inside it', () => {
    expect(manifest.scope).toBe('/')
    expect(manifest.start_url).toBe('/')
  })

  it('runs standalone', () => {
    expect(manifest.display).toBe('standalone')
  })

  // Honoured on Android and ignored by iOS, which is why `.rotate-notice`
  // exists. Both are needed and neither replaces the other.
  it('asks for portrait', () => {
    expect(manifest.orientation).toBe('portrait')
  })
})
