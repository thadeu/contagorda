import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActiveFilters } from './ActiveFilters'

function show(props: Partial<Parameters<typeof ActiveFilters>[0]>) {
  const onClearRecurring = vi.fn()
  const onClearPerson = vi.fn()

  render(
    <ActiveFilters
      recurring={false}
      person={null}
      onClearRecurring={onClearRecurring}
      onClearPerson={onClearPerson}
      {...props}
    />,
  )

  return { onClearRecurring, onClearPerson }
}

describe('ActiveFilters', () => {
  it('shows nothing when nothing narrows the list', () => {
    const { container } = render(
      <ActiveFilters recurring={false} person={null} onClearRecurring={vi.fn()} onClearPerson={vi.fn()} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('takes each filter off on its own', () => {
    const { onClearRecurring, onClearPerson } = show({ recurring: true, person: 'Jéssica' })

    fireEvent.click(screen.getByRole('button', { name: 'Tirar o filtro Jéssica' }))

    expect(onClearPerson).toHaveBeenCalledTimes(1)
    expect(onClearRecurring).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Tirar o filtro Recorrentes' }))

    expect(onClearRecurring).toHaveBeenCalledTimes(1)
  })
})
