import { describe, expect, it } from 'vitest'
import { createMockServices } from './index'

describe('findOrCreate', () => {
  const services = createMockServices()

  it('gives a new category the icon it was created with', async () => {
    const created = await services.categories.findOrCreate('Pet', 'expense', '🐶')

    expect(created.icon).toBe('🐶')
  })

  it('reuses a category by name, whatever the icon says', async () => {
    const first = await services.categories.findOrCreate('Farmácia', 'expense', '💊')
    const second = await services.categories.findOrCreate('farmacia ', 'expense', '🏥')

    expect(second.id).toBe(first.id)
  })

  /**
   * The name is the identity. A second entry of the same category with a
   * different emoji is a preference in the moment, not a correction to
   * everything already filed under it.
   */
  it('does not repaint an existing category', async () => {
    await services.categories.findOrCreate('Mercado', 'expense', '🛒')
    const again = await services.categories.findOrCreate('Mercado', 'expense', '🎁')

    expect(again.icon).toBe('🛒')
  })

  it('accepts a category with no icon at all', async () => {
    const created = await services.categories.findOrCreate('Sem ícone', 'expense')

    expect(created.icon).toBeNull()
  })
})
