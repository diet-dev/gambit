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

  it('shows whose turn it is in the status bar', () => {
    const { container } = render(<ChessGame />)

    expect(container.querySelector('.status-bar')).toHaveTextContent('Ход белых')
  })

  it('shows the check status in the status bar', () => {
    const { container } = render(<ChessGame initialPosition="4k3/8/8/8/8/8/8/4R1K1 b - - 0 1" />)

    expect(container.querySelector('.status-bar')).toHaveTextContent('Шах чёрным!')
  })

  it('highlights the king square when it is in check', () => {
    const { container } = render(<ChessGame initialPosition="4k3/8/8/8/8/8/8/4R1K1 b - - 0 1" />)

    expect(container.querySelector('[data-square="e8"] > div')).toHaveStyle({
      backgroundImage:
        'radial-gradient(circle, transparent 35%, rgba(255, 215, 0, 0.8) 65%, rgba(255, 215, 0, 0.8) 100%)'
    })
  })

  it('highlights the king square in red on checkmate', () => {
    const { container } = render(
      <ChessGame initialPosition="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3" />
    )

    expect(container.querySelector('[data-square="e1"] > div')).toHaveStyle({
      backgroundImage:
        'radial-gradient(circle, transparent 35%, rgba(255, 0, 0, 0.75) 65%, rgba(255, 0, 0, 0.75) 100%)'
    })
  })

  it('marks the status bar on checkmate', () => {
    const { container } = render(
      <ChessGame initialPosition="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3" />
    )

    const statusBar = container.querySelector('.status-bar')

    expect(statusBar).toHaveTextContent('Мат! Победа чёрных')
    expect(statusBar).toHaveClass('status-bar-checkmate')
  })

  it('does not mark the status bar during a normal turn', () => {
    const { container } = render(<ChessGame />)

    expect(container.querySelector('.status-bar')).not.toHaveClass('status-bar-checkmate')
  })

  it('shows a bot toggle that is off by default', () => {
    const { container } = render(<ChessGame />)

    const toggle = container.querySelector('input[type="checkbox"]')

    expect(toggle).toBeInTheDocument()
    expect(toggle).not.toBeChecked()
    expect(container).toHaveTextContent('Играть с ботом')
  })
})
