import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ChessGame from './ChessGame'

describe('ChessGame', () => {
  it('renders all 64 squares of the board', () => {
    const { container } = render(<ChessGame />)

    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })

  it('renders the starting position pieces', () => {
    const { container } = render(<ChessGame />)

    expect(container.querySelector('[data-square="e1"] [data-piece="wK"]')).toBeInTheDocument()
  })

  it('highlights the selected piece and its possible moves on click', () => {
    const { container } = render(<ChessGame />)

    fireEvent.click(container.querySelector('[data-square="e2"]')!)

    expect(container.querySelector('[data-square="e2"] > div')).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 0, 0.4)'
    })
    expect(container.querySelector('[data-square="e4"] > div')).toHaveStyle({
      backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 22%, transparent 23%)'
    })
  })
})
