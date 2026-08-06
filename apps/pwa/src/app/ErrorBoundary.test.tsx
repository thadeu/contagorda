import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = true

function Boom() {
  if (shouldThrow) {
    throw new Error('quebrou')
  }

  return <p>tudo certo</p>
}

beforeEach(() => {
  shouldThrow = true
  // React logs the caught error itself; the noise is not the test's fault.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('reports instead of leaving a blank screen', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/algo deu errado/i)).toBeTruthy()
  })

  it('says nothing technical, because the person reading is not debugging', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.queryByText(/quebrou/i)).toBeNull()
  })

  /**
   * Retrying has to remount. Clearing the flag alone renders the same components
   * over the same state and throws again on the spot, which reads as a button
   * that does nothing.
   */
  it('recovers when the cause is gone', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))

    expect(screen.getByText('tudo certo')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
