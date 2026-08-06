import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Portal } from './Portal'

afterEach(() => {
  document.getElementById('root')?.remove()
})

function withRoot() {
  const root = document.createElement('div')

  root.id = 'root'
  document.body.appendChild(root)

  return root
}

describe('Portal', () => {
  /**
   * The destination is the point. The body is one step too far: the status-bar
   * spacer sits ahead of the root and makes everything inside it taller than the
   * viewport, which is what keeps the band off the bottom edge in the installed
   * app. Anything portalled past the root leaves that arrangement.
   */
  it('lands inside the root, not beside it', () => {
    const root = withRoot()

    render(
      <Portal>
        <p data-testid="sheet">sheet</p>
      </Portal>,
    )

    expect(root.querySelector('[data-testid="sheet"]')).not.toBeNull()
  })

  it('still renders when there is no root to find', () => {
    const { getByTestId } = render(
      <Portal>
        <p data-testid="sheet">sheet</p>
      </Portal>,
    )

    expect(getByTestId('sheet')).toBeTruthy()
  })
})
