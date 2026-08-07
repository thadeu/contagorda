import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmSheet } from './ConfirmSheet'

function renderSheet(overrides: Partial<Parameters<typeof ConfirmSheet>[0]> = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()

  render(
    <ConfirmSheet
      title="Arquivar Nubank?"
      message="Ela sai das listas."
      confirmLabel="Arquivar"
      onConfirm={onConfirm}
      onClose={onClose}
      {...overrides}
    />,
  )

  return { onConfirm, onClose }
}

describe('ConfirmSheet', () => {
  it('only acts when the named action is chosen', () => {
    const { onConfirm } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  /**
   * Closing is announced only once the panel has finished leaving, so the parent
   * does not unmount it mid-slide.
   */
  it('backing out does not act', async () => {
    const { onConfirm, onClose } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('tapping away is backing out, not confirming', async () => {
    const { onConfirm, onClose } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cannot be fired twice while it is working', () => {
    const { onConfirm } = renderSheet({ pending: true })

    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }))

    expect(onConfirm).not.toHaveBeenCalled()
  })
})
