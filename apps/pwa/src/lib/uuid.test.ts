import { afterEach, describe, expect, it } from 'vitest'
import { uuid } from './uuid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const real = crypto.randomUUID

afterEach(() => {
  Object.defineProperty(crypto, 'randomUUID', { value: real, configurable: true })
})

describe('uuid', () => {
  it('looks like a v4 uuid', () => {
    expect(uuid()).toMatch(V4)
  })

  it('still works where randomUUID is missing, which is any plain-http origin', () => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })

    expect(uuid()).toMatch(V4)
  })

  it('does not repeat', () => {
    expect(new Set(Array.from({ length: 500 }, uuid)).size).toBe(500)
  })
})
