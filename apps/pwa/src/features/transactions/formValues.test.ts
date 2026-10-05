import { describe, expect, it } from 'vitest'
import { emptyValues } from './formValues'

describe('emptyValues', () => {
  it('starts a new entry as unpaid', () => {
    expect(emptyValues().paid).toBe(false)
  })

  it('starts as an expense, dated today', () => {
    expect(emptyValues()).toMatchObject({ kind: 'expense', amount: '', description: '' })
  })
})
