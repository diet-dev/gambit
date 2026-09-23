import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
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
})
