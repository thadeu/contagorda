import { describe, expect, it } from 'vitest'
import { CATEGORY_ICONS, searchIcons } from './categoryIcons'

describe('CATEGORY_ICONS', () => {
  it('fills whole rows of six, so the grid never ends ragged', () => {
    expect(CATEGORY_ICONS.length % 6).toBe(0)
  })

  it('has no repeats, which would be two cells doing one job', () => {
    expect(new Set(CATEGORY_ICONS.map((icon) => icon.emoji)).size).toBe(CATEGORY_ICONS.length)
  })
})

describe('searchIcons', () => {
  it('shows everything before anything is typed', () => {
    expect(searchIcons('')).toHaveLength(CATEGORY_ICONS.length)
    expect(searchIcons('   ')).toHaveLength(CATEGORY_ICONS.length)
  })

  /**
   * The accent is the first thing to go when someone types quickly, so the
   * search has to find the word without it.
   */
  it('finds an accented word typed without accents', () => {
    expect(searchIcons('farmacia').map((i) => i.emoji)).toContain('💊')
    expect(searchIcons('ONIBUS').map((i) => i.emoji)).toContain('🚌')
  })

  it('finds by the word someone would reach for, not the glyph name', () => {
    expect(searchIcons('gasolina').map((i) => i.emoji)).toContain('⛽')
    expect(searchIcons('uber').map((i) => i.emoji)).toContain('🚕')
    expect(searchIcons('netflix').map((i) => i.emoji)).toContain('📺')
  })

  it('matches partway through a word, because people stop typing early', () => {
    expect(searchIcons('merc').map((i) => i.emoji)).toContain('🛒')
  })

  it('comes back empty rather than falling back to everything', () => {
    expect(searchIcons('zzzzz')).toHaveLength(0)
  })
})
