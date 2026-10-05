import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CloneMonthSheet } from './CloneMonthSheet'

function renderSheet(overrides: Partial<Parameters<typeof CloneMonthSheet>[0]> = {}) {
  const onSubmit = vi.fn()
  const onClose = vi.fn()

  render(
    <CloneMonthSheet
      source="2026-09"
      pending={false}
      error={null}
      onSubmit={onSubmit}
      onClose={onClose}
      {...overrides}
    />,
  )

  return { onSubmit, onClose }
}

describe('CloneMonthSheet', () => {
  it('names the month being copied', () => {
    renderSheet()

    expect(screen.getByText('De setembro de 2026')).toBeTruthy()
  })

  it('offers the twelve months after it, and not the month itself', () => {
    renderSheet()

    const options = screen.getAllByRole('radio')

    expect(options).toHaveLength(12)
    expect(options[0].getAttribute('aria-label')).toBe('outubro de 2026')
    expect(options[11].getAttribute('aria-label')).toBe('setembro de 2027')
    expect(screen.queryByRole('radio', { name: 'setembro de 2026' })).toBeNull()
  })

  it('has the next month chosen, so the common case is one tap', () => {
    const { onSubmit } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /copiar para/i }))

    expect(onSubmit).toHaveBeenCalledWith('2026-10')
  })

  it('copies into the month that was chosen', () => {
    const { onSubmit } = renderSheet()

    fireEvent.click(screen.getByRole('radio', { name: 'dezembro de 2026' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copiar para dezembro de 2026' }))

    expect(onSubmit).toHaveBeenCalledWith('2026-12')
  })

  it('runs the year over into the next', () => {
    renderSheet({ source: '2026-12' })

    expect(screen.getAllByRole('radio')[0].getAttribute('aria-label')).toBe('janeiro de 2027')
  })

  it('cannot be fired twice while the request is out', () => {
    const { onSubmit } = renderSheet({ pending: true })

    fireEvent.click(screen.getByRole('button', { name: 'Copiando…' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows why the server refused', () => {
    renderSheet({ error: 'Já estamos copiando lançamentos para esse mês.' })

    expect(screen.getByRole('alert').textContent).toMatch(/Já estamos copiando/)
  })
})
