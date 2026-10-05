import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PanelHostContext } from '@/app/layout/panelHost'
import type { ListView } from '@/features/transactions/useStatusFilter'
import { FilterSheet } from './FilterSheet'

const people = [
  { id: 'jess', name: 'Jéssica', email: 'jecoiega7@gmail.com', count: 5 },
  { id: 'ana', name: 'Ana', email: 'ana@exemplo.com', count: 2 },
]

const idle: ListView = { sort: 'date', recurring: false, by: null }

function show(overrides: Partial<Parameters<typeof FilterSheet>[0]> = {}) {
  const onApply = vi.fn()
  const onClose = vi.fn()

  render(
    <FilterSheet
      view={idle}
      people={people}
      recurringCount={12}
      onApply={onApply}
      onClose={onClose}
      {...overrides}
    />,
  )

  return { onApply, onClose }
}

async function done(onClose: () => void) {
  fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

  await waitFor(() => expect(onClose).toHaveBeenCalled())
}

describe('FilterSheet', () => {
  it('says how many rows of the month repeat', () => {
    show()

    expect(screen.getByText('12 lançamentos no mês')).toBeTruthy()
  })

  it('lists who entered something, with the email and how many', () => {
    show()

    expect(screen.getByText('jecoiega7@gmail.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Jéssica/ }).textContent).toContain('5')
  })

  it('holds the choices until the sheet closes, then writes them together', async () => {
    const { onApply, onClose } = show()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: /Jéssica/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nome' }))

    expect(onApply).not.toHaveBeenCalled()

    await done(onClose)

    expect(onApply).toHaveBeenCalledWith({ sort: 'description', recurring: true, by: 'jess' })
  })

  it('writes nothing when nothing changed', async () => {
    const { onApply, onClose } = show()

    await done(onClose)

    expect(onApply).not.toHaveBeenCalled()
  })

  it('takes a person off by choosing them again', async () => {
    const { onApply, onClose } = show({ view: { ...idle, by: 'jess' } })

    fireEvent.click(screen.getByRole('button', { name: /Jéssica/ }))
    await done(onClose)

    expect(onApply).toHaveBeenCalledWith({ ...idle, by: null })
  })

  it('goes back to the defaults in one tap', async () => {
    const { onApply, onClose } = show({ view: { sort: 'amount', recurring: true, by: 'ana' } })

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    await done(onClose)

    expect(onApply).toHaveBeenCalledWith(idle)
  })

  it('greys the reset out when everything is already at the default', () => {
    show()

    expect(screen.getByRole('button', { name: 'Limpar filtros' }).hasAttribute('disabled')).toBe(true)
  })

  // One person's rows are all the rows: choosing them would only restate the month.
  it('offers no people when only one entered anything', () => {
    show({ people: [people[0]] })

    expect(screen.queryByText('Pessoas')).toBeNull()
  })

  it('keeps the people when one is chosen, so it can be taken back', () => {
    show({ people: [people[0]], view: { ...idle, by: 'jess' } })

    expect(screen.getByText('Pessoas')).toBeTruthy()
  })

  it('applies what was chosen from the button at the foot, and closes', async () => {
    const { onApply, onClose } = show()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(onApply).toHaveBeenCalledWith({ ...idle, recurring: true })
  })

  it('closes without writing when the button is pressed with nothing changed', async () => {
    const { onApply, onClose } = show()

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(onApply).not.toHaveBeenCalled()
  })
})

// The desktop has no swipe and no backdrop; the panel is a column beside the page.
describe('FilterSheet in the desktop panel', () => {
  it('applies from the button and stays open, so it can be used again', async () => {
    const host = document.createElement('div')

    document.body.appendChild(host)

    const onApply = vi.fn()
    const onClose = vi.fn()

    render(
      <PanelHostContext value={host}>
        <FilterSheet
          view={idle}
          people={people}
          recurringCount={12}
          onApply={onApply}
          onClose={onClose}
        />
      </PanelHostContext>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Jéssica/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(onApply).toHaveBeenCalledWith({ ...idle, by: 'jess' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Filtrar e ordenar' })).toBeTruthy()

    host.remove()
  })

  it('still applies on the way out through the X', async () => {
    const host = document.createElement('div')

    document.body.appendChild(host)

    const onApply = vi.fn()
    const onClose = vi.fn()

    render(
      <PanelHostContext value={host}>
        <FilterSheet
          view={idle}
          people={people}
          recurringCount={12}
          onApply={onApply}
          onClose={onClose}
        />
      </PanelHostContext>,
    )

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Só recorrentes' }))
    fireEvent.click(screen.getByRole('button', { name: /Fechar/ }))

    expect(onApply).toHaveBeenCalledWith({ ...idle, recurring: true })
    expect(onClose).toHaveBeenCalled()

    host.remove()
  })

  it('does nothing to the list when the button is pressed with nothing changed', async () => {
    const host = document.createElement('div')

    document.body.appendChild(host)

    const onApply = vi.fn()

    render(
      <PanelHostContext value={host}>
        <FilterSheet
          view={idle}
          people={people}
          recurringCount={12}
          onApply={onApply}
          onClose={vi.fn()}
        />
      </PanelHostContext>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Aplicar filtros' }))

    expect(onApply).not.toHaveBeenCalled()

    host.remove()
  })
})
