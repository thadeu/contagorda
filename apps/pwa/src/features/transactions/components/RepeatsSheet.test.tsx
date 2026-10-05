import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RepeatsSheet } from './RepeatsSheet'

function show(overrides: Partial<Parameters<typeof RepeatsSheet>[0]> = {}) {
  const onSelect = vi.fn()

  render(
    <RepeatsSheet
      date="2026-10-10"
      frequency="monthly"
      interval={1}
      value={1}
      onSelect={onSelect}
      onClose={vi.fn()}
      {...overrides}
    />,
  )

  return { onSelect }
}

describe('RepeatsSheet', () => {
  /**
   * The label counts entries and the rule counts repeats after the first. "14
   * meses" once wrote fifteen rows, because the number on the label was handed
   * on as it stood.
   */
  it('writes as many rows as the label says', () => {
    const { onSelect } = show()

    fireEvent.click(screen.getByRole('button', { name: /^14 meses/ }))

    expect(onSelect).toHaveBeenCalledWith(13)
  })

  it('ends in the month the count lands on, this one included', () => {
    show()

    const row = screen.getByRole('button', { name: /^14 meses/ })

    expect(row.textContent).toContain('novembro de 2027')
  })

  it('starts at two, because one is a row that does not repeat', () => {
    show()

    const labels = screen.getAllByRole('listitem').map((item) => item.textContent)

    expect(labels[0]).toMatch(/^2 meses/)
    expect(labels).toHaveLength(47)
    expect(labels[labels.length - 1]).toMatch(/^48 meses/)
  })

  it('marks the count that matches what is stored', () => {
    show({ value: 13 })

    expect(screen.getByRole('button', { name: /^14 meses/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /^13 meses/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('counts years the same way', () => {
    show({ frequency: 'yearly' })

    expect(screen.getByRole('button', { name: /^3 anos/ }).textContent).toContain('2028')
  })

  it('offers one to four years when they are paid every month', () => {
    const { onSelect } = show({ frequency: 'yearly', monthly: true })

    const labels = screen.getAllByRole('listitem').map((item) => item.textContent)

    expect(labels).toHaveLength(4)
    expect(labels[0]).toMatch(/^1 ano/)

    const row = screen.getByRole('button', { name: /^3 anos/ })

    expect(row.textContent).toContain('setembro de 2029')

    fireEvent.click(row)

    expect(onSelect).toHaveBeenCalledWith(2)
  })
})
