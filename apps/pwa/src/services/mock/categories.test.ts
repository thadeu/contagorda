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

describe('editing and removing', () => {
  const services = createMockServices()

  it('renames and re-icons in place, keeping the id', async () => {
    const created = await services.categories.findOrCreate('Mercadoo', 'expense', '🛒')
    const fixed = await services.categories.update(created.id, { name: 'Mercado', icon: '🥖' })

    expect(fixed.id).toBe(created.id)
    expect(fixed.name).toBe('Mercado')
    expect(fixed.icon).toBe('🥖')
  })

  /**
   * A transaction has to have happened somewhere, so an account is archived. A
   * category is only a label: the row without it is still true, just less
   * useful, and keeping dead categories in every picker forever is the worse
   * trade.
   */
  it('leaves the transactions behind, uncategorised', async () => {
    const category = await services.categories.findOrCreate('Temporária', 'expense', '📦')
    const created = await services.transactions.create({
      account_id: 'a',
      category_id: category.id,
      kind: 'expense',
      amount_cents: 1_000,
      date: '2026-08-10',
      description: 'compra',
      paid: false,
    })

    await services.categories.remove(category.id)

    const rows = await services.transactions.listByMonth('2026-08')
    const survivor = rows.find((row) => row.id === created.id)

    expect(survivor).toBeDefined()
    expect(survivor?.category_id).toBeNull()
    expect(survivor?.amount_cents).toBe(1_000)
  })

  it('takes it out of the list', async () => {
    const category = await services.categories.findOrCreate('Some', 'expense', '🎪')

    await services.categories.remove(category.id)

    const all = await services.categories.list()

    expect(all.map((c) => c.id)).not.toContain(category.id)
  })
})
