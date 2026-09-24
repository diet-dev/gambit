import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import Dialog from './Dialog'

describe('Dialog', () => {
  it('renders children in a modal dialog', () => {
    const { getByRole, getByText } = render(
      <Dialog titleId="test-title" onClose={() => {}}>
        <h2 id="test-title">Заголовок</h2>
        <p>Содержимое</p>
      </Dialog>
    )

    expect(getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(getByText('Содержимое')).toBeInTheDocument()
  })

  it('closes on the close button and on Escape', () => {
    const onClose = vi.fn()
    const { getByRole } = render(
      <Dialog titleId="test-title" onClose={onClose}>
        <h2 id="test-title">Заголовок</h2>
      </Dialog>
    )

    fireEvent.click(getByRole('button', { name: 'Закрыть' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
