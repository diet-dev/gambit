import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import ChessGame from './ChessGame'
import type { Engine } from '../engine/stockfish'

afterEach(() => {
  localStorage.clear()
})

describe('ChessGame', () => {
  it('renders all 64 squares of the board', () => {
    const { container } = render(<ChessGame />)

    expect(container.querySelectorAll('[data-square]')).toHaveLength(64)
  })

  it('reports the current position when the save button is clicked', () => {
    const onSaveSituation = vi.fn()
    const { getByRole } = render(<ChessGame onSaveSituation={onSaveSituation} />)

    fireEvent.click(getByRole('button', { name: 'Сохранить позицию как ситуацию' }))

    expect(onSaveSituation).toHaveBeenCalledWith(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    )
  })

  it('hides the save button when no handler is given', () => {
    const { queryByRole } = render(<ChessGame />)

    expect(
      queryByRole('button', { name: 'Сохранить позицию как ситуацию' })
    ).not.toBeInTheDocument()
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

  it('marks the status bar green on a draw', () => {
    const { container } = render(<ChessGame initialPosition="8/8/8/8/8/8/8/K6k w - - 0 1" />)

    const statusBar = container.querySelector('.status-bar')

    expect(statusBar).toHaveTextContent('Ничья: недостаточно материала')
    expect(statusBar).toHaveClass('status-bar-draw')
  })

  it('marks the status bar green on a stalemate', () => {
    const { container } = render(<ChessGame initialPosition="7k/5Q2/6K1/8/8/8/8/8 b - - 0 1" />)

    const statusBar = container.querySelector('.status-bar')

    expect(statusBar).toHaveTextContent('Пат — ничья')
    expect(statusBar).toHaveClass('status-bar-draw')
  })

  it('shows the bot switch off and the weakest level by default', () => {
    const { getByRole } = render(<ChessGame />)

    expect(getByRole('switch', { name: 'Играть с ботом' })).toHaveAttribute('aria-checked', 'false')
    expect(getByRole('button', { name: /Сила соперника: 3 разряд/ })).toBeInTheDocument()
  })

  it('configures the engine strength when the bot is turned on', () => {
    const engine: Engine = {
      configureStrength: vi.fn(async () => {}),
      findBestMove: vi.fn(async () => 'e7e5'),
      dispose: vi.fn()
    }
    const { getByRole } = render(<ChessGame getEngine={() => engine} />)

    fireEvent.click(getByRole('switch'))

    expect(engine.configureStrength).toHaveBeenCalledWith(1350)
  })

  it('reconfigures the engine and stores the level when it changes while on', () => {
    const engine: Engine = {
      configureStrength: vi.fn(async () => {}),
      findBestMove: vi.fn(async () => 'e7e5'),
      dispose: vi.fn()
    }
    const { getByRole } = render(<ChessGame getEngine={() => engine} />)

    fireEvent.click(getByRole('switch'))
    fireEvent.click(getByRole('button', { name: /Сила соперника/ }))
    fireEvent.click(getByRole('option', { name: /Мастер/ }))

    expect(engine.configureStrength).toHaveBeenLastCalledWith(2200)
    expect(localStorage.getItem('gambit-engine-level')).toBe('4')
  })
})
